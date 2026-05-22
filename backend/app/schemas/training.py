"""Pydantic schemas for the training endpoint."""
from __future__ import annotations

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field


class TrainRequest(BaseModel):
    """Body for POST /train."""

    dataset_id: str
    model_type: Literal["ARIMA", "PROPHET", "LSTM", "GRU", "TRANSFORMER"]
    validation_size: int = Field(ge=1, description="Number of tail rows to hold out")
    forecast_horizon: int = Field(ge=1, description="Steps to forecast after training")

    # Optional hyperparams – classical
    arima_order: Optional[tuple[int, int, int]] = None
    seasonal_order: Optional[tuple[int, int, int, int]] = None

    # Optional hyperparams – deep learning
    learning_rate: Optional[float] = None
    epochs: Optional[int] = None
    hidden_size: Optional[int] = None
    lookback_window: Optional[int] = None
    num_heads: Optional[int] = None
    num_layers: Optional[int] = None
    batch_size: Optional[int] = None


class MetricsResponse(BaseModel):
    """Evaluation metrics."""

    rmse: float
    mse: float
    mae: float
    mape: float
    smape: float


class TrainResponse(BaseModel):
    """Returned after a model is trained."""

    model_id: str
    dataset_id: str
    model_type: str
    status: str
    metrics: Optional[MetricsResponse] = None
    hyperparameters: dict
    created_at: datetime
