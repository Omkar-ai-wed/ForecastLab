"""Pydantic schemas for dataset endpoints."""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class DatasetUploadResponse(BaseModel):
    """Returned after a successful dataset upload."""

    dataset_id: str
    rows: int
    start_date: str
    end_date: str
    frequency: Optional[str] = None
    target_column: str
    feature_columns: list[str] = []


class DatasetMetadataResponse(BaseModel):
    """Single dataset entry in the list endpoint."""

    dataset_id: str
    original_filename: str
    date_column: str
    target_column: str
    feature_columns: list[str] = []
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    frequency: Optional[str] = None
    row_count: int
    created_at: datetime
