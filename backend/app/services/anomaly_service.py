"""
Simple anomaly detection on time-series data.
Methods: z-score (rolling) and IQR.
"""
from __future__ import annotations

import logging

import numpy as np
import pandas as pd

logger = logging.getLogger("forecast_lab.anomaly_service")


def detect_anomalies(
    df: pd.DataFrame,
    date_column: str,
    target_column: str,
    method: str = "zscore",
    threshold: float = 3.0,
    window: int = 30,
) -> list[dict]:
    """
    Detect anomalies in a time-series.

    Parameters
    ----------
    df            : DataFrame sorted by date
    date_column   : datetime column name
    target_column : target column name
    method        : 'zscore' or 'iqr'
    threshold     : z-score threshold or IQR multiplier
    window        : rolling window size (used for z-score method)

    Returns
    -------
    list of dicts with keys: timestamp, value, score
    """
    values = df[target_column].values.astype(np.float64)
    timestamps = df[date_column].astype(str).values
    anomalies: list[dict] = []

    if method == "zscore":
        series = pd.Series(values)
        rolling_mean = series.rolling(window=window, min_periods=1).mean()
        rolling_std = series.rolling(window=window, min_periods=1).std().fillna(1.0)
        rolling_std = rolling_std.replace(0, 1.0)

        z_scores = ((series - rolling_mean) / rolling_std).abs()

        for i in range(len(values)):
            score = float(z_scores.iloc[i])
            if score >= threshold:
                anomalies.append({
                    "timestamp": str(timestamps[i]),
                    "value": float(values[i]),
                    "score": round(score, 4),
                })

    elif method == "iqr":
        q1 = np.percentile(values, 25)
        q3 = np.percentile(values, 75)
        iqr = q3 - q1
        lower_bound = q1 - threshold * iqr
        upper_bound = q3 + threshold * iqr

        for i in range(len(values)):
            val = float(values[i])
            if val < lower_bound or val > upper_bound:
                # Score = how many IQRs beyond the fence
                if iqr > 0:
                    score = max(abs(val - lower_bound), abs(val - upper_bound)) / iqr
                else:
                    score = 0.0
                anomalies.append({
                    "timestamp": str(timestamps[i]),
                    "value": val,
                    "score": round(score, 4),
                })
    else:
        raise ValueError(f"Unknown anomaly detection method: {method}. Use 'zscore' or 'iqr'.")

    logger.info(
        "Anomaly detection (%s, threshold=%.1f): %d anomalies in %d points",
        method, threshold, len(anomalies), len(values),
    )
    return anomalies
