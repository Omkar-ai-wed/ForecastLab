"""
Classical time-series models: ARIMA and Prophet.
"""
from __future__ import annotations

import logging
from typing import Any

import numpy as np
import pandas as pd

logger = logging.getLogger("forecast_lab.classical_models")


# ═══════════════════════════════════════════════════════════════════════════
# ARIMA
# ═══════════════════════════════════════════════════════════════════════════

def train_arima(
    train_series: pd.Series,
    order: tuple[int, int, int] = (5, 1, 0),
    seasonal_order: tuple[int, int, int, int] | None = None,
) -> Any:
    """
    Fit a statsmodels ARIMA (or SARIMAX if seasonal_order given).

    Returns the fitted model result.
    """
    from statsmodels.tsa.arima.model import ARIMA

    logger.info("Training ARIMA order=%s seasonal=%s on %d points", order, seasonal_order, len(train_series))

    if seasonal_order:
        from statsmodels.tsa.statespace.sarimax import SARIMAX
        model = SARIMAX(train_series, order=order, seasonal_order=seasonal_order)
    else:
        model = ARIMA(train_series, order=order)

    fitted = model.fit()
    logger.info("ARIMA AIC=%.2f", fitted.aic)
    return fitted


def predict_arima(fitted_model: Any, steps: int) -> np.ndarray:
    """Generate out-of-sample forecasts from a fitted ARIMA."""
    forecast = fitted_model.forecast(steps=steps)
    return np.asarray(forecast, dtype=np.float64)


def arima_confidence_intervals(fitted_model: Any, steps: int, alpha: float = 0.05):
    """Return (lower, upper) arrays for the forecast."""
    pred = fitted_model.get_forecast(steps=steps)
    ci = pred.conf_int(alpha=alpha)
    return ci.iloc[:, 0].values, ci.iloc[:, 1].values


# ═══════════════════════════════════════════════════════════════════════════
# Prophet
# ═══════════════════════════════════════════════════════════════════════════

def train_prophet(
    train_df: pd.DataFrame,
    date_column: str,
    target_column: str,
) -> Any:
    """
    Fit a Prophet model.

    Parameters
    ----------
    train_df      : DataFrame with at least date and target columns
    date_column   : name of datetime column
    target_column : name of target column

    Returns the fitted Prophet model.
    """
    try:
        from prophet import Prophet
    except ImportError:
        raise ImportError(
            "Prophet is not installed. Install with: pip install prophet"
        )

    df_prophet = train_df[[date_column, target_column]].rename(
        columns={date_column: "ds", target_column: "y"}
    )

    logger.info("Training Prophet on %d points", len(df_prophet))
    model = Prophet(daily_seasonality="auto", yearly_seasonality="auto")
    model.fit(df_prophet)
    return model


def predict_prophet(
    model: Any,
    periods: int,
    frequency: str | None = None,
) -> pd.DataFrame:
    """
    Generate future predictions from Prophet.

    Returns DataFrame with columns: ds, yhat, yhat_lower, yhat_upper
    """
    freq = frequency or "D"
    future = model.make_future_dataframe(periods=periods, freq=freq)
    forecast = model.predict(future)
    return forecast[["ds", "yhat", "yhat_lower", "yhat_upper"]].tail(periods)
