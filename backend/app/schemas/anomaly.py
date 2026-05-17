"""Pydantic schemas for anomaly detection endpoint."""
from __future__ import annotations

from typing import Optional

from pydantic import BaseModel


class AnomalyPoint(BaseModel):
    timestamp: str
    value: float
    score: float


class DataPoint(BaseModel):
    """A single data point for charting — includes anomaly flag."""
    timestamp: str
    value: float
    score: float
    is_anomaly: bool


class Stats(BaseModel):
    """Descriptive statistics for the target column."""
    min: float
    max: float
    mean: float
    std: float


class AnomalyResponse(BaseModel):
    anomalies: list[AnomalyPoint]
    data: list[DataPoint]        # ALL points for the chart
    stats: Stats                 # Descriptive stats
    method: str
    threshold: float
    total_points: int
    anomaly_count: int
