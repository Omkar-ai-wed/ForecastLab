"""
Dataset loading, validation, and frequency inference.
"""
from __future__ import annotations

import logging
import os
from io import StringIO

import pandas as pd
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.database import DatasetRecord

logger = logging.getLogger("forecast_lab.dataset_service")


def load_dataset(dataset_id: str, db: Session) -> tuple[pd.DataFrame, DatasetRecord]:
    """
    Look up the dataset in the DB, read the CSV, and return both.

    If the local CSV file is missing (e.g. after a cloud restart),
    reconstruct it from the csv_content stored in the database.

    Raises
    ------
    HTTPException 404 if dataset_id is not found.
    """
    record = db.query(DatasetRecord).filter(DatasetRecord.dataset_id == dataset_id).first()
    if record is None:
        raise HTTPException(status_code=404, detail=f"Dataset '{dataset_id}' not found.")

    # Try reading from disk first
    if os.path.exists(record.file_path):
        df = pd.read_csv(record.file_path, parse_dates=[record.date_column])
    elif record.csv_content:
        # Reconstruct from database (cloud persistence)
        logger.info("Reconstructing CSV for dataset %s from database", dataset_id)
        df = pd.read_csv(StringIO(record.csv_content), parse_dates=[record.date_column])
        # Also write it back to disk for subsequent reads
        os.makedirs(os.path.dirname(record.file_path) or "data", exist_ok=True)
        with open(record.file_path, "w", encoding="utf-8") as f:
            f.write(record.csv_content)
    else:
        raise HTTPException(
            status_code=404,
            detail=f"Dataset '{dataset_id}' data file is missing and no backup exists in the database.",
        )

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
