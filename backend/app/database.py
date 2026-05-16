"""
SQLite database setup via SQLAlchemy.
Tables: datasets, trained_models
"""
import json
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
