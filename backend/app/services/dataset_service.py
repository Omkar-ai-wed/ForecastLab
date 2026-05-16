"""
Dataset loading, validation, and frequency inference.
"""
from __future__ import annotations

import logging

import pandas as pd
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.database import DatasetRecord

logger = logging.getLogger("forecast_lab.dataset_service")


def load_dataset(dataset_id: str, db: Session) -> tuple[pd.DataFrame, DatasetRecord]:
    """
    Look up the dataset in the DB, read the CSV, and return both.

    Raises
    ------
    HTTPException 404 if dataset_id is not found.
    """
    record = db.query(DatasetRecord).filter(DatasetRecord.dataset_id == dataset_id).first()
    if record is None:
        raise HTTPException(status_code=404, detail=f"Dataset '{dataset_id}' not found.")

    df = pd.read_csv(record.file_path, parse_dates=[record.date_column])
    df.sort_values(record.date_column, inplace=True)
    df.reset_index(drop=True, inplace=True)
    return df, record


def validate_columns(
    df: pd.DataFrame,
    date_column: str,
    target_column: str,
    feature_columns: list[str] | None = None,
) -> None:
    """Raise 400 if required columns are missing from the DataFrame."""
    missing = []
    if date_column not in df.columns:
        missing.append(date_column)
    if target_column not in df.columns:
        missing.append(target_column)
    for col in feature_columns or []:
        if col not in df.columns:
            missing.append(col)
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"Missing columns in CSV: {missing}. Available: {list(df.columns)}",
        )


def infer_frequency(df: pd.DataFrame, date_column: str) -> str | None:
    """Try to infer the time-series frequency; return None on failure."""
    try:
        freq = pd.infer_freq(df[date_column])
        return freq
    except Exception:
        logger.warning("Could not infer frequency for column '%s'", date_column)
        return None
