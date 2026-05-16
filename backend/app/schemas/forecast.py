"""Pydantic schemas for forecast endpoints."""
from __future__ import annotations

from typing import Optional

from pydantic import BaseModel


class ForecastRequest(BaseModel):
    """Body for POST /forecast."""

    model_id: str
    forecast_horizon: Optional[int] = None


class HistoricalPoint(BaseModel):
    timestamp: str
    value: float


class ForecastPoint(BaseModel):
    timestamp: str
    predicted: float
    lower: Optional[float] = None
    upper: Optional[float] = None


class ForecastResponse(BaseModel):
    historical: list[HistoricalPoint]
    forecast: list[ForecastPoint]
