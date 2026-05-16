"""Pydantic schemas for anomaly detection endpoint."""
from __future__ import annotations

from pydantic import BaseModel


class AnomalyPoint(BaseModel):
    timestamp: str
    value: float
    score: float


class AnomalyResponse(BaseModel):
    anomalies: list[AnomalyPoint]
    method: str
    threshold: float
    total_points: int
    anomaly_count: int
