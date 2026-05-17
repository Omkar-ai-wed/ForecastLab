"""
Anomaly detection endpoint:
  GET /anomalies/{dataset_id}  – detect anomalies in target series
"""
from __future__ import annotations

import logging

import numpy as np
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.anomaly import AnomalyPoint, AnomalyResponse, DataPoint, Stats
from app.services.anomaly_service import detect_anomalies
from app.services.dataset_service import load_dataset

router = APIRouter()
logger = logging.getLogger("forecast_lab.routes.anomalies")


@router.get("/anomalies/{dataset_id}", response_model=AnomalyResponse)
async def anomalies(
    dataset_id: str,
    method: str = Query("zscore", pattern="^(zscore|iqr)$"),
    threshold: float = Query(3.0, gt=0),
    window: int = Query(30, ge=2),
    db: Session = Depends(get_db),
):
    """
    Run anomaly detection on a dataset's target column.

    Query Parameters
    ----------------
    method    : 'zscore' or 'iqr'
    threshold : detection threshold (z-score units or IQR multiplier)
    window    : rolling window size (for z-score method)
    """
    df, ds_rec = load_dataset(dataset_id, db)

    anomaly_list = detect_anomalies(
        df=df,
        date_column=ds_rec.date_column,
        target_column=ds_rec.target_column,
        method=method,
        threshold=threshold,
        window=window,
    )

    points = [AnomalyPoint(**a) for a in anomaly_list]

    # Build anomaly timestamp set for O(1) lookup
    anomaly_timestamps = {a["timestamp"] for a in anomaly_list}

    # Build ALL data points for charting with is_anomaly flag
    all_data = []
    values = df[ds_rec.target_column].values.astype(float)
    timestamps = df[ds_rec.date_column].astype(str).values

    # Pre-compute scores for all points (not just anomalies)
    import pandas as pd
    series = pd.Series(values)
    if method == "zscore":
        rolling_mean = series.rolling(window=window, min_periods=1).mean()
        rolling_std = series.rolling(window=window, min_periods=1).std().fillna(1.0).replace(0, 1.0)
        all_scores = ((series - rolling_mean) / rolling_std).abs().values
    else:
        q1 = np.percentile(values, 25)
        q3 = np.percentile(values, 75)
        iqr = q3 - q1
        if iqr > 0:
            all_scores = np.maximum(np.abs(values - q1), np.abs(values - q3)) / iqr
        else:
            all_scores = np.zeros(len(values))

    for i in range(len(values)):
        ts = str(timestamps[i])
        all_data.append(DataPoint(
            timestamp=ts,
            value=float(values[i]),
            score=round(float(all_scores[i]), 4),
            is_anomaly=ts in anomaly_timestamps,
        ))

    # Compute descriptive stats
    stats = Stats(
        min=float(np.min(values)) if len(values) > 0 else 0.0,
        max=float(np.max(values)) if len(values) > 0 else 0.0,
        mean=float(np.mean(values)) if len(values) > 0 else 0.0,
        std=float(np.std(values)) if len(values) > 0 else 0.0,
    )

    return AnomalyResponse(
        anomalies=points,
        data=all_data,
        stats=stats,
        method=method,
        threshold=threshold,
        total_points=len(df),
        anomaly_count=len(points),
    )
