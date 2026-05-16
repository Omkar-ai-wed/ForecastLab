"""
Forecasting endpoints:
  POST /forecast                    – generate forecast JSON
  GET  /forecast/download/{model_id} – download forecast as CSV
"""
from __future__ import annotations

import io
import logging

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import TrainedModelRecord, get_db
from app.schemas.forecast import (
    ForecastPoint,
    ForecastRequest,
    ForecastResponse,
    HistoricalPoint,
)
from app.services.dataset_service import load_dataset
from app.services.forecast_service import generate_forecast

router = APIRouter()
logger = logging.getLogger("forecast_lab.routes.forecasting")

HISTORICAL_TAIL = 50  # Number of recent historical points to return


def _get_model_record(model_id: str, db: Session) -> TrainedModelRecord:
    record = (
        db.query(TrainedModelRecord)
        .filter(TrainedModelRecord.model_id == model_id)
        .first()
    )
    if record is None:
        raise HTTPException(status_code=404, detail=f"Model '{model_id}' not found.")
    return record


@router.post("/forecast", response_model=ForecastResponse)
async def forecast(req: ForecastRequest, db: Session = Depends(get_db)):
    """Generate a forecast from a trained model."""
    model_rec = _get_model_record(req.model_id, db)
    df, ds_rec = load_dataset(model_rec.dataset_id, db)

    horizon = req.forecast_horizon or model_rec.forecast_horizon

    forecast_df = generate_forecast(
        model_id=model_rec.model_id,
        model_type=model_rec.model_type,
        dataset_df=df,
        date_column=ds_rec.date_column,
        target_column=ds_rec.target_column,
        horizon=horizon,
        frequency=ds_rec.frequency,
    )

    # Build historical tail
    tail = df.tail(HISTORICAL_TAIL)
    historical = [
        HistoricalPoint(
            timestamp=str(row[ds_rec.date_column]),
            value=float(row[ds_rec.target_column]),
        )
        for _, row in tail.iterrows()
    ]

    # Build forecast list
    forecast_points = [
        ForecastPoint(
            timestamp=str(row["timestamp"]),
            predicted=float(row["predicted"]),
            lower=float(row["lower"]) if row["lower"] is not None and pd.notna(row["lower"]) else None,
            upper=float(row["upper"]) if row["upper"] is not None and pd.notna(row["upper"]) else None,
        )
        for _, row in forecast_df.iterrows()
    ]

    return ForecastResponse(historical=historical, forecast=forecast_points)


@router.get("/forecast/download/{model_id}")
async def download_forecast(model_id: str, db: Session = Depends(get_db)):
    """Download historical + forecast data as a CSV file."""
    model_rec = _get_model_record(model_id, db)
    df, ds_rec = load_dataset(model_rec.dataset_id, db)

    horizon = model_rec.forecast_horizon

    forecast_df = generate_forecast(
        model_id=model_rec.model_id,
        model_type=model_rec.model_type,
        dataset_df=df,
        date_column=ds_rec.date_column,
        target_column=ds_rec.target_column,
        horizon=horizon,
        frequency=ds_rec.frequency,
    )

    # Combine historical and forecast into one CSV
    hist = df[[ds_rec.date_column, ds_rec.target_column]].copy()
    hist.columns = ["timestamp", "value"]
    hist["predicted"] = None
    hist["lower"] = None
    hist["upper"] = None
    hist["type"] = "historical"

    fcast = forecast_df.copy()
    fcast["value"] = None
    fcast["type"] = "forecast"

    combined = pd.concat(
        [hist[["timestamp", "value", "predicted", "lower", "upper", "type"]],
         fcast[["timestamp", "value", "predicted", "lower", "upper", "type"]]],
        ignore_index=True,
    )

    buf = io.StringIO()
    combined.to_csv(buf, index=False)
    buf.seek(0)

    filename = f"forecast_{model_id}.csv"
    logger.info("CSV download for model %s (%d rows)", model_id, len(combined))

    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
