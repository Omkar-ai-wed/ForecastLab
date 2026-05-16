"""
Evaluation metrics for time-series forecasting.
RMSE, MSE, MAE, MAPE, SMAPE
"""
from __future__ import annotations

import numpy as np
from sklearn.metrics import mean_absolute_error, mean_squared_error


def _safe_mape(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """Mean Absolute Percentage Error – skips zeros in y_true."""
    mask = y_true != 0
    if mask.sum() == 0:
        return 0.0
    return float(np.mean(np.abs((y_true[mask] - y_pred[mask]) / y_true[mask])) * 100)


def _smape(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """Symmetric Mean Absolute Percentage Error."""
    denom = np.abs(y_true) + np.abs(y_pred)
    mask = denom != 0
    if mask.sum() == 0:
        return 0.0
    return float(np.mean(2.0 * np.abs(y_true[mask] - y_pred[mask]) / denom[mask]) * 100)


def evaluate_forecast(y_true, y_pred) -> dict:
    """
    Compute all metrics.

    Parameters
    ----------
    y_true : array-like  – ground truth values
    y_pred : array-like  – predicted values

    Returns
    -------
    dict with keys: rmse, mse, mae, mape, smape
    """
    y_true = np.asarray(y_true, dtype=np.float64)
    y_pred = np.asarray(y_pred, dtype=np.float64)

    mse = float(mean_squared_error(y_true, y_pred))
    rmse = float(np.sqrt(mse))
    mae = float(mean_absolute_error(y_true, y_pred))
    mape = _safe_mape(y_true, y_pred)
    smape = _smape(y_true, y_pred)

    return {
        "rmse": round(rmse, 6),
        "mse": round(mse, 6),
        "mae": round(mae, 6),
        "mape": round(mape, 6),
        "smape": round(smape, 6),
    }
