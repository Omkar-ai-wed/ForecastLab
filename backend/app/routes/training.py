"""
Training endpoint:
  POST /train  – train a classical or deep model, evaluate, persist
"""
from __future__ import annotations

import json
import logging
import uuid
from datetime import datetime

import numpy as np
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import TrainedModelRecord, get_db, SessionLocal
from app.schemas.training import MetricsResponse, TrainRequest, TrainResponse
from app.services.classical_models import (
    predict_arima,
    predict_prophet,
    train_arima,
    train_prophet,
)
from app.services.dataset_service import load_dataset
from app.services.deep_models import train_deep_model, predict_deep_model
from app.utils.metrics import evaluate_forecast
from app.utils.model_io import save_model

import threading

router = APIRouter()
logger = logging.getLogger("forecast_lab.routes.training")


def run_training_background(
    model_id: str,
    dataset_id: str,
    model_type: str,
    validation_size: int,
    forecast_horizon: int,
    arima_order: list[int] | tuple[int, ...] | None,
    seasonal_order: list[int] | tuple[int, ...] | None,
    lookback_window: int | None,
    hidden_size: int | None,
    num_layers: int | None,
    num_heads: int | None,
    epochs: int | None,
    learning_rate: float | None,
    batch_size: int | None,
):
    """
    Run model training, validation evaluation, and serialization in a background thread.
    Updates the model record status to 'completed' or 'failed'.
    """
    db = SessionLocal()
    try:
        df, ds_record = load_dataset(dataset_id, db)
        date_col = ds_record.date_column
        target_col = ds_record.target_column

        train_df = df.iloc[:-validation_size]
        val_df = df.iloc[-validation_size:]
        y_true = val_df[target_col].values.astype(np.float64)

        hyperparams: dict = {}
        model_obj = None
        extra: dict = {}

        # ── Classical models ──────────────────────────────────────────────────
        if model_type == "ARIMA":
            order = tuple(arima_order) if arima_order else (5, 1, 0)
            seasonal = tuple(seasonal_order) if seasonal_order else None
            hyperparams = {"order": list(order)}
            if seasonal:
                hyperparams["seasonal_order"] = list(seasonal)

            model_obj = train_arima(train_df[target_col], order=order, seasonal_order=seasonal)
            y_pred = predict_arima(model_obj, validation_size)

        elif model_type == "PROPHET":
            model_obj = train_prophet(train_df, date_col, target_col)
            freq = ds_record.frequency or "D"
            prophet_forecast = model_obj.predict(
                model_obj.make_future_dataframe(periods=validation_size, freq=freq)
            )
            y_pred = prophet_forecast["yhat"].values[-validation_size :]
            hyperparams = {"frequency": freq}

        # ── Deep models ───────────────────────────────────────────────────────
        elif model_type in ("LSTM", "GRU", "TRANSFORMER"):
            config = {
                "lookback_window": lookback_window or 30,
                "hidden_size": hidden_size or 64,
                "num_layers": num_layers or 2,
                "num_heads": num_heads or 4,
                "epochs": epochs or 50,
                "learning_rate": learning_rate or 0.001,
                "batch_size": batch_size or 32,
            }
            hyperparams = config.copy()

            train_values = train_df[target_col].values.astype(np.float64)
            net, scaler, info = train_deep_model(train_values, model_type, config)

            # Predict on validation set
            lookback = config["lookback_window"]
            full_values = df[target_col].values.astype(np.float64)
            scaled_full = scaler.transform(full_values.reshape(-1, 1)).flatten()

            # The window ending just before validation starts
            val_start = len(train_df)
            last_window = scaled_full[val_start - lookback : val_start]
            y_pred = predict_deep_model(net, last_window, scaler, validation_size)

            model_obj = net
            # Store scaler params for later reconstruction
            extra = {
                "config": config,
                "scaler_params": {
                    "min_": scaler.min_.tolist(),
                    "scale_": scaler.scale_.tolist(),
                    "data_min_": scaler.data_min_.tolist(),
                    "data_max_": scaler.data_max_.tolist(),
                    "data_range_": scaler.data_range_.tolist(),
                    "n_samples_seen_": int(scaler.n_samples_seen_),
                },
            }
        else:
            raise ValueError(f"Unsupported model type: {model_type}")

        # ── Evaluate ──────────────────────────────────────────────────────────
        metrics = evaluate_forecast(y_true, y_pred)

        # ── Persist ───────────────────────────────────────────────────────────
        model_path = save_model(model_obj, model_id, model_type, extra=extra)

        # Update record in DB
        record = db.query(TrainedModelRecord).filter(TrainedModelRecord.model_id == model_id).first()
        if record:
            record.status = "completed"
            record.hyperparameters = json.dumps(hyperparams)
            record.metrics = json.dumps(metrics)
            record.model_path = model_path
            db.commit()
            logger.info("Background training of %s model %s completed successfully (RMSE=%.4f)", model_type, model_id, metrics["rmse"])

    except Exception as e:
        logger.exception("Failed training model %s in background: %s", model_id, e)
        try:
            record = db.query(TrainedModelRecord).filter(TrainedModelRecord.model_id == model_id).first()
            if record:
                record.status = "failed"
                record.metrics = json.dumps({"error": str(e)})
                db.commit()
        except Exception as db_err:
            logger.exception("Failed to update status to failed for model %s: %s", model_id, db_err)
    finally:
        db.close()


@router.post("/train", response_model=TrainResponse)
async def train_model(req: TrainRequest, db: Session = Depends(get_db)):
    """
    Train a forecasting model on the specified dataset. Runs asynchronously in a background thread.
    """
    df, ds_record = load_dataset(req.dataset_id, db)

    # 1. Validation size check
    if req.validation_size >= len(df):
        raise HTTPException(
            status_code=400,
            detail=f"validation_size ({req.validation_size}) must be < dataset rows ({len(df)}).",
        )

    # 2. Lookback window check for deep learning models
    if req.model_type in ("LSTM", "GRU", "TRANSFORMER"):
        lookback = req.lookback_window or 30
        if len(df) - req.validation_size <= lookback:
            raise HTTPException(
                status_code=400,
                detail=f"For deep models, training size ({len(df) - req.validation_size}) must be greater than lookback window ({lookback}). Please reduce validation size or lookback window.",
            )

    model_id = str(uuid.uuid4())[:8]
    hyperparams: dict = {}

    # Initialize hyperparams dict for early UI response
    if req.model_type == "ARIMA":
        order = tuple(req.arima_order) if req.arima_order else (5, 1, 0)
        seasonal = tuple(req.seasonal_order) if req.seasonal_order else None
        hyperparams = {"order": list(order)}
        if seasonal:
            hyperparams["seasonal_order"] = list(seasonal)
    elif req.model_type == "PROPHET":
        freq = ds_record.frequency or "D"
        hyperparams = {"frequency": freq}
    elif req.model_type in ("LSTM", "GRU", "TRANSFORMER"):
        hyperparams = {
            "lookback_window": req.lookback_window or 30,
            "hidden_size": req.hidden_size or 64,
            "num_layers": req.num_layers or 2,
            "num_heads": req.num_heads or 4,
            "epochs": req.epochs or 50,
            "learning_rate": req.learning_rate or 0.001,
            "batch_size": req.batch_size or 32,
        }

    # Store the initial "training" state in the database
    record = TrainedModelRecord(
        model_id=model_id,
        dataset_id=req.dataset_id,
        model_type=req.model_type,
        hyperparameters=json.dumps(hyperparams),
        metrics=json.dumps({}),
        model_path="",
        status="training",
        forecast_horizon=req.forecast_horizon,
        validation_size=req.validation_size,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    # Start the training asynchronously in a separate thread to not block the event loop
    thread = threading.Thread(
        target=run_training_background,
        args=(
            model_id,
            req.dataset_id,
            req.model_type,
            req.validation_size,
            req.forecast_horizon,
            req.arima_order,
            req.seasonal_order,
            req.lookback_window,
            req.hidden_size,
            req.num_layers,
            req.num_heads,
            req.epochs,
            req.learning_rate,
            req.batch_size,
        )
    )
    thread.start()

    logger.info("Spawning background training thread for %s model %s", req.model_type, model_id)

    return TrainResponse(
        model_id=model_id,
        dataset_id=req.dataset_id,
        model_type=req.model_type,
        status="training",
        metrics=None,
        hyperparameters=hyperparams,
        created_at=record.created_at or datetime.utcnow(),
    )
