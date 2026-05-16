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

from app.database import TrainedModelRecord, get_db
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

router = APIRouter()
logger = logging.getLogger("forecast_lab.routes.training")


@router.post("/train", response_model=TrainResponse)
async def train_model(req: TrainRequest, db: Session = Depends(get_db)):
    """
    Train a forecasting model on the specified dataset.

    Steps:
    1. Load dataset  2. Split train/validation  3. Train  4. Evaluate  5. Persist
    """
    df, ds_record = load_dataset(req.dataset_id, db)

    date_col = ds_record.date_column
    target_col = ds_record.target_column

    if req.validation_size >= len(df):
        raise HTTPException(
            status_code=400,
            detail=f"validation_size ({req.validation_size}) must be < dataset rows ({len(df)}).",
        )

    train_df = df.iloc[: -req.validation_size]
    val_df = df.iloc[-req.validation_size :]
    y_true = val_df[target_col].values.astype(np.float64)

    model_id = str(uuid.uuid4())[:8]
    hyperparams: dict = {}
    model_obj = None
    extra: dict = {}

    # ── Classical models ──────────────────────────────────────────────────
    if req.model_type == "ARIMA":
        order = tuple(req.arima_order) if req.arima_order else (5, 1, 0)
        seasonal = tuple(req.seasonal_order) if req.seasonal_order else None
        hyperparams = {"order": list(order)}
        if seasonal:
            hyperparams["seasonal_order"] = list(seasonal)

        model_obj = train_arima(train_df[target_col], order=order, seasonal_order=seasonal)
        y_pred = predict_arima(model_obj, req.validation_size)

    elif req.model_type == "PROPHET":
        model_obj = train_prophet(train_df, date_col, target_col)
        freq = ds_record.frequency or "D"
        prophet_forecast = model_obj.predict(
            model_obj.make_future_dataframe(periods=req.validation_size, freq=freq)
        )
        y_pred = prophet_forecast["yhat"].values[-req.validation_size :]
        hyperparams = {"frequency": freq}

    # ── Deep models ───────────────────────────────────────────────────────
    elif req.model_type in ("LSTM", "GRU", "TRANSFORMER"):
        config = {
            "lookback_window": req.lookback_window or 30,
            "hidden_size": req.hidden_size or 64,
            "num_layers": req.num_layers or 2,
            "num_heads": req.num_heads or 4,
            "epochs": req.epochs or 50,
            "learning_rate": req.learning_rate or 0.001,
            "batch_size": req.batch_size or 32,
        }
        hyperparams = config.copy()

        train_values = train_df[target_col].values.astype(np.float64)
        net, scaler, info = train_deep_model(train_values, req.model_type, config)

        # Predict on validation set
        lookback = config["lookback_window"]
        full_values = df[target_col].values.astype(np.float64)
        scaled_full = scaler.transform(full_values.reshape(-1, 1)).flatten()

        # The window ending just before validation starts
        val_start = len(train_df)
        last_window = scaled_full[val_start - lookback : val_start]
        y_pred = predict_deep_model(net, last_window, scaler, req.validation_size)

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
        raise HTTPException(status_code=400, detail=f"Unsupported model type: {req.model_type}")

    # ── Evaluate ──────────────────────────────────────────────────────────
    metrics = evaluate_forecast(y_true, y_pred)

    # ── Persist ───────────────────────────────────────────────────────────
    model_path = save_model(model_obj, model_id, req.model_type, extra=extra)

    record = TrainedModelRecord(
        model_id=model_id,
        dataset_id=req.dataset_id,
        model_type=req.model_type,
        hyperparameters=json.dumps(hyperparams),
        metrics=json.dumps(metrics),
        model_path=model_path,
        forecast_horizon=req.forecast_horizon,
        validation_size=req.validation_size,
    )
    db.add(record)
    db.commit()

    logger.info("Trained %s model %s — RMSE=%.4f", req.model_type, model_id, metrics["rmse"])

    return TrainResponse(
        model_id=model_id,
        dataset_id=req.dataset_id,
        model_type=req.model_type,
        metrics=MetricsResponse(**metrics),
        hyperparameters=hyperparams,
        created_at=record.created_at or datetime.utcnow(),
    )
