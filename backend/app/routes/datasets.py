"""
Dataset endpoints:
  POST /datasets/upload  – upload and register a CSV
  GET  /datasets         – list all datasets
"""
from __future__ import annotations

import json
import logging
import os
import uuid
from io import StringIO
from typing import Optional

import pandas as pd
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.database import DatasetRecord, get_db
from app.schemas.dataset import DatasetMetadataResponse, DatasetUploadResponse
from app.services.dataset_service import infer_frequency, validate_columns

router = APIRouter()
logger = logging.getLogger("forecast_lab.routes.datasets")

DATA_DIR = "data"


@router.post("/datasets/upload", response_model=DatasetUploadResponse)
async def upload_dataset(
    file: UploadFile = File(...),
    date_column: str = Form(...),
    target_column: str = Form(...),
    feature_columns: Optional[str] = Form(None),
    db: Session = Depends(get_db),
):
    """
    Upload a CSV file, validate columns, infer frequency, and persist metadata.
    Stores CSV content directly in the database for cloud persistence.
    """
    # Parse feature columns (comma-separated string)
    feat_cols: list[str] = []
    if feature_columns:
        feat_cols = [c.strip() for c in feature_columns.split(",") if c.strip()]

    # Read CSV
    try:
        raw_content = (await file.read()).decode("utf-8")
        df = pd.read_csv(StringIO(raw_content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read CSV: {e}")

    # Validate columns exist
    validate_columns(df, date_column, target_column, feat_cols)

    # Parse dates & sort
    try:
        df[date_column] = pd.to_datetime(df[date_column])
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Cannot parse '{date_column}' as datetime: {e}")

    df.sort_values(date_column, inplace=True)
    df.reset_index(drop=True, inplace=True)

    # Infer frequency
    freq = infer_frequency(df, date_column)

    # Generate ID & save to disk (local fallback)
    dataset_id = str(uuid.uuid4())[:8]
    os.makedirs(DATA_DIR, exist_ok=True)
    csv_path = os.path.join(DATA_DIR, f"{dataset_id}.csv")
    csv_string = df.to_csv(index=False)
    
    # Also save locally for immediate use
    with open(csv_path, "w", encoding="utf-8") as f:
        f.write(csv_string)

    start_date = str(df[date_column].min())
    end_date = str(df[date_column].max())

    # Persist metadata + CSV content in the database
    record = DatasetRecord(
        dataset_id=dataset_id,
        original_filename=file.filename or "unknown.csv",
        file_path=csv_path,
        date_column=date_column,
        target_column=target_column,
        feature_columns=json.dumps(feat_cols),
        csv_content=csv_string,  # Store CSV in DB for cloud persistence
        start_date=start_date,
        end_date=end_date,
        frequency=freq,
        row_count=len(df),
    )
    db.add(record)
    db.commit()

    logger.info("Uploaded dataset %s (%d rows) → %s", dataset_id, len(df), csv_path)

    return DatasetUploadResponse(
        dataset_id=dataset_id,
        rows=len(df),
        start_date=start_date,
        end_date=end_date,
        frequency=freq,
        target_column=target_column,
        feature_columns=feat_cols,
    )


@router.get("/datasets", response_model=list[DatasetMetadataResponse])
async def list_datasets(db: Session = Depends(get_db)):
    """Return all dataset metadata."""
    records = db.query(DatasetRecord).order_by(DatasetRecord.created_at.desc()).all()
    return [
        DatasetMetadataResponse(
            dataset_id=r.dataset_id,
            original_filename=r.original_filename,
            date_column=r.date_column,
            target_column=r.target_column,
            feature_columns=r.feature_columns_list(),
            start_date=r.start_date,
            end_date=r.end_date,
            frequency=r.frequency,
            row_count=r.row_count,
            created_at=r.created_at,
        )
        for r in records
    ]
