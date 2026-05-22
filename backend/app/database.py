"""
PostgreSQL (Supabase) database setup via SQLAlchemy.
Tables: datasets, trained_models

Uses DATABASE_URL environment variable for the connection string.
Falls back to local SQLite for development if not set.
"""
import json
import os
from datetime import datetime

from sqlalchemy import (
    Column,
    DateTime,
    Integer,
    String,
    Text,
    create_engine,
)
from sqlalchemy.orm import DeclarativeBase, sessionmaker

# --------------------------------------------------------------------------
# Connection: Supabase PostgreSQL in production, SQLite locally
# --------------------------------------------------------------------------
DATABASE_URL = os.environ.get("DATABASE_URL")

if DATABASE_URL:
    # Supabase/Render provide postgres:// but SQLAlchemy needs postgresql://
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)
else:
    # Fallback to local SQLite for development
    DATABASE_URL = "sqlite:///./forecast_lab.db"
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


class DatasetRecord(Base):
    """Metadata for an uploaded dataset."""

    __tablename__ = "datasets"

    dataset_id = Column(String, primary_key=True, index=True)
    original_filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    date_column = Column(String, nullable=False)
    target_column = Column(String, nullable=False)
    feature_columns = Column(Text, default="[]")  # JSON list
    csv_content = Column(Text, nullable=True)  # Store CSV data directly in DB
    start_date = Column(String, nullable=True)
    end_date = Column(String, nullable=True)
    frequency = Column(String, nullable=True)
    row_count = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    def feature_columns_list(self) -> list[str]:
        return json.loads(self.feature_columns) if self.feature_columns else []


class TrainedModelRecord(Base):
    """Metadata for a trained forecasting model."""

    __tablename__ = "trained_models"

    model_id = Column(String, primary_key=True, index=True)
    dataset_id = Column(String, nullable=False, index=True)
    model_type = Column(String, nullable=False)
    hyperparameters = Column(Text, default="{}")  # JSON dict
    metrics = Column(Text, default="{}")  # JSON dict
    model_path = Column(String, nullable=False)
    forecast_horizon = Column(Integer, nullable=False)
    validation_size = Column(Integer, nullable=False)
    status = Column(String, default="completed")
    created_at = Column(DateTime, default=datetime.utcnow)

    def hyperparameters_dict(self) -> dict:
        return json.loads(self.hyperparameters) if self.hyperparameters else {}

    def metrics_dict(self) -> dict:
        return json.loads(self.metrics) if self.metrics else {}


def create_tables():
    """Create all tables in the database."""
    Base.metadata.create_all(bind=engine)


def get_db():
    """FastAPI dependency that yields a DB session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
