"""
Sequence creation utilities for deep learning models.
Sliding-window approach over the target (+ optional feature) columns.
"""
from __future__ import annotations

import numpy as np


def create_sequences(
    data: np.ndarray,
    lookback_window: int,
) -> tuple[np.ndarray, np.ndarray]:
    """
    Create sliding-window sequences for supervised learning.

    Parameters
    ----------
    data           : 1-D or 2-D array (n_samples,) or (n_samples, n_features)
    lookback_window: number of past time steps per input sample

    Returns
    -------
    X : (n_samples - lookback_window, lookback_window, n_features)
    y : (n_samples - lookback_window,)   – the next target value
    """
    if data.ndim == 1:
        data = data.reshape(-1, 1)

    n = len(data)
    X, y = [], []
    for i in range(lookback_window, n):
        X.append(data[i - lookback_window : i])
        y.append(data[i, 0])  # target is always the first column
    return np.array(X, dtype=np.float32), np.array(y, dtype=np.float32)
