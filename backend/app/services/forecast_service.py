"""
Forecast generation from a trained model.
Handles classical (ARIMA, Prophet) and deep (LSTM, GRU, Transformer) models.
"""
from __future__ import annotations

import logging
from typing import Any

import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler

from app.services.classical_models import (
    arima_confidence_intervals,
    predict_arima,
    predict_prophet,
)
from app.services.deep_models import (
    LSTMForecaster,
    GRUForecaster,
    TransformerForecaster,
    _build_model,
    predict_deep_model,
)
from app.utils.model_io import load_model

logger = logging.getLogger("forecast_lab.forecast_service")


def generate_forecast(
    model_id: str,
    model_type: str,
    dataset_df: pd.DataFrame,
    date_column: str,
    target_column: str,
    horizon: int,
    frequency: str | None = None,
) -> pd.DataFrame:
    """
    Load model and produce a forecast DataFrame.

    Returns
    -------
    DataFrame with columns: timestamp, predicted, lower, upper
    """
    model_obj, extra = load_model(model_id, model_type)

    last_date = dataset_df[date_column].max()
    freq = frequency or "D"

    if model_type == "ARIMA":
        preds = predict_arima(model_obj, horizon)
        try:
            lower, upper = arima_confidence_intervals(model_obj, horizon)
        except Exception:
            lower = upper = [None] * horizon
        future_dates = pd.date_range(start=last_date, periods=horizon + 1, freq=freq)[1:]

        return pd.DataFrame({
            "timestamp": future_dates.astype(str),
            "predicted": preds,
            "lower": lower,
            "upper": upper,
        })

    elif model_type == "PROPHET":
        forecast_df = predict_prophet(model_obj, horizon, freq)
        return pd.DataFrame({
            "timestamp": forecast_df["ds"].astype(str).values,
            "predicted": forecast_df["yhat"].values,
            "lower": forecast_df["yhat_lower"].values,
            "upper": forecast_df["yhat_upper"].values,
        })

    else:
        # Deep model (LSTM / GRU / TRANSFORMER)
        config = extra.get("config", extra)
        lookback = config.get("lookback_window", 30)

        # Rebuild model architecture and load state dict
        net = _build_model(model_type, input_size=1, config=config)
        import torch
        net.load_state_dict(model_obj)
        net.eval()

        # Reconstruct scaler from saved params
        scaler = MinMaxScaler()
        scaler_params = config.get("scaler_params", {})
        if scaler_params:
            scaler.min_ = np.array(scaler_params["min_"])
            scaler.scale_ = np.array(scaler_params["scale_"])
            scaler.data_min_ = np.array(scaler_params["data_min_"])
            scaler.data_max_ = np.array(scaler_params["data_max_"])
            scaler.data_range_ = np.array(scaler_params["data_range_"])
            scaler.n_features_in_ = 1
            scaler.n_samples_seen_ = scaler_params.get("n_samples_seen_", 1)
            scaler.feature_range = (0, 1)
        else:
            # Fallback: fit on last available data
            tail = dataset_df[target_column].values[-lookback * 2 :].reshape(-1, 1)
            scaler.fit(tail)

        # Scale the last lookback window
        raw_window = dataset_df[target_column].values[-lookback:]
        scaled_window = scaler.transform(raw_window.reshape(-1, 1)).flatten()

        preds = predict_deep_model(net, scaled_window, scaler, horizon)

        future_dates = pd.date_range(start=last_date, periods=horizon + 1, freq=freq)[1:]

        return pd.DataFrame({
            "timestamp": future_dates.astype(str),
            "predicted": preds,
            "lower": [None] * horizon,
            "upper": [None] * horizon,
        })
