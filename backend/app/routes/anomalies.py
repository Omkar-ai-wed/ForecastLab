"""
Anomaly detection endpoint:
  GET /anomalies/{dataset_id}  – detect anomalies in target series
"""
from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.anomaly import AnomalyPoint, AnomalyResponse
from app.services.anomaly_service import detect_anomalies
from app.services.dataset_service import load_dataset

router = APIRouter()
logger = logging.getLogger("forecast_lab.routes.anomalies")


@router.get("/anomalies/{dataset_id}", response_model=AnomalyResponse)
async def anomalies(
    dataset_id: str,
    method: str = Query("zscore", regex="^(zscore|iqr)$"),
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

    return AnomalyResponse(
        anomalies=points,
        method=method,
        threshold=threshold,
        total_points=len(df),
        anomaly_count=len(points),
    )
