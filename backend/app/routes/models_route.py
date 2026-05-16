"""
Model listing and metrics endpoints:
  GET /models              – list all trained models
  GET /metrics/{model_id}  – metrics for a specific model
"""
from __future__ import annotations

import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import TrainedModelRecord, get_db
from app.schemas.training import MetricsResponse

router = APIRouter()
logger = logging.getLogger("forecast_lab.routes.models")


@router.get("/models")
async def list_models(db: Session = Depends(get_db)):
    """Return all trained model metadata with metrics."""
    records = (
        db.query(TrainedModelRecord)
        .order_by(TrainedModelRecord.created_at.desc())
        .all()
    )
    return [
        {
            "model_id": r.model_id,
            "dataset_id": r.dataset_id,
            "model_type": r.model_type,
            "hyperparameters": r.hyperparameters_dict(),
            "metrics": r.metrics_dict(),
            "forecast_horizon": r.forecast_horizon,
            "validation_size": r.validation_size,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in records
    ]


@router.get("/metrics/{model_id}", response_model=MetricsResponse)
async def get_model_metrics(model_id: str, db: Session = Depends(get_db)):
    """Return evaluation metrics for a specific model."""
    record = (
        db.query(TrainedModelRecord)
        .filter(TrainedModelRecord.model_id == model_id)
        .first()
    )
    if record is None:
        raise HTTPException(status_code=404, detail=f"Model '{model_id}' not found.")

    metrics = record.metrics_dict()
    return MetricsResponse(
        rmse=metrics.get("rmse", 0.0),
        mse=metrics.get("mse", 0.0),
        mae=metrics.get("mae", 0.0),
        mape=metrics.get("mape", 0.0),
        smape=metrics.get("smape", 0.0),
    )
