"""
Model persistence helpers.
- Classical models → joblib
- Prophet → pickle
- PyTorch deep models → torch.save / torch.load
"""
from __future__ import annotations

import json
import logging
import os
import pickle
from typing import Any

import joblib

logger = logging.getLogger("forecast_lab.model_io")

MODELS_DIR = "models_store"


def _ensure_dir():
    os.makedirs(MODELS_DIR, exist_ok=True)


# ── Save ──────────────────────────────────────────────────────────────────

def save_model(model: Any, model_id: str, model_type: str, extra: dict | None = None) -> str:
    """
    Persist a trained model to disk.

    Parameters
    ----------
    model     : the fitted model object
    model_id  : unique identifier
    model_type: one of ARIMA, PROPHET, LSTM, GRU, TRANSFORMER
    extra     : optional dict of auxiliary objects (e.g. scaler, config)

    Returns
    -------
    str – path to the saved file
    """
    _ensure_dir()

    if model_type in ("LSTM", "GRU", "TRANSFORMER"):
        import torch

        path = os.path.join(MODELS_DIR, f"{model_id}.pt")
        payload = {"state_dict": model.state_dict(), "config": extra or {}}
        torch.save(payload, path)
    elif model_type == "PROPHET":
        path = os.path.join(MODELS_DIR, f"{model_id}.pkl")
        with open(path, "wb") as f:
            pickle.dump(model, f)
        # Save extra (scaler etc.) alongside
        if extra:
            meta_path = os.path.join(MODELS_DIR, f"{model_id}_meta.json")
            with open(meta_path, "w") as f:
                json.dump(extra, f)
    else:
        # ARIMA / statsmodels
        path = os.path.join(MODELS_DIR, f"{model_id}.joblib")
        joblib.dump(model, path)
        if extra:
            meta_path = os.path.join(MODELS_DIR, f"{model_id}_meta.json")
            with open(meta_path, "w") as f:
                json.dump(extra, f)

    logger.info("Saved %s model → %s", model_type, path)
    return path


# ── Load ──────────────────────────────────────────────────────────────────

def load_model(model_id: str, model_type: str) -> tuple[Any, dict]:
    """
    Load a trained model from disk.

    Returns
    -------
    (model, extra_dict)
    """
    if model_type in ("LSTM", "GRU", "TRANSFORMER"):
        import torch

        path = os.path.join(MODELS_DIR, f"{model_id}.pt")
        if not os.path.exists(path):
            raise FileNotFoundError(f"Model file not found: {path}")
        payload = torch.load(path, map_location="cpu", weights_only=False)
        return payload["state_dict"], payload.get("config", {})

    elif model_type == "PROPHET":
        path = os.path.join(MODELS_DIR, f"{model_id}.pkl")
        if not os.path.exists(path):
            raise FileNotFoundError(f"Model file not found: {path}")
        with open(path, "rb") as f:
            model = pickle.load(f)
        extra = {}
        meta_path = os.path.join(MODELS_DIR, f"{model_id}_meta.json")
        if os.path.exists(meta_path):
            with open(meta_path) as f:
                extra = json.load(f)
        return model, extra

    else:
        path = os.path.join(MODELS_DIR, f"{model_id}.joblib")
        if not os.path.exists(path):
            raise FileNotFoundError(f"Model file not found: {path}")
        model = joblib.load(path)
        extra = {}
        meta_path = os.path.join(MODELS_DIR, f"{model_id}_meta.json")
        if os.path.exists(meta_path):
            with open(meta_path) as f:
                extra = json.load(f)
        return model, extra
