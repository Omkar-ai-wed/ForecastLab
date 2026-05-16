"""
Deep learning models for time-series forecasting.
LSTM, GRU, Transformer – all implemented in PyTorch.
"""
from __future__ import annotations

import logging
import math
from typing import Any

import numpy as np
import torch
import torch.nn as nn
from sklearn.preprocessing import MinMaxScaler

from app.utils.sequences import create_sequences

logger = logging.getLogger("forecast_lab.deep_models")


# ═══════════════════════════════════════════════════════════════════════════
# Model architectures
# ═══════════════════════════════════════════════════════════════════════════

class LSTMForecaster(nn.Module):
    def __init__(self, input_size: int = 1, hidden_size: int = 64, num_layers: int = 2):
        super().__init__()
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        self.lstm = nn.LSTM(input_size, hidden_size, num_layers, batch_first=True)
        self.fc = nn.Linear(hidden_size, 1)

    def forward(self, x):
        out, _ = self.lstm(x)
        out = self.fc(out[:, -1, :])
        return out.squeeze(-1)


class GRUForecaster(nn.Module):
    def __init__(self, input_size: int = 1, hidden_size: int = 64, num_layers: int = 2):
        super().__init__()
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        self.gru = nn.GRU(input_size, hidden_size, num_layers, batch_first=True)
        self.fc = nn.Linear(hidden_size, 1)

    def forward(self, x):
        out, _ = self.gru(x)
        out = self.fc(out[:, -1, :])
        return out.squeeze(-1)


class PositionalEncoding(nn.Module):
    def __init__(self, d_model: int, max_len: int = 5000):
        super().__init__()
        pe = torch.zeros(max_len, d_model)
        position = torch.arange(0, max_len, dtype=torch.float).unsqueeze(1)
        div_term = torch.exp(torch.arange(0, d_model, 2).float() * (-math.log(10000.0) / d_model))
        pe[:, 0::2] = torch.sin(position * div_term)
        if d_model > 1:
            pe[:, 1::2] = torch.cos(position * div_term[: d_model // 2])
        self.register_buffer("pe", pe.unsqueeze(0))

    def forward(self, x):
        return x + self.pe[:, : x.size(1)]


class TransformerForecaster(nn.Module):
    def __init__(
        self,
        input_size: int = 1,
        d_model: int = 64,
        num_heads: int = 4,
        num_layers: int = 2,
        lookback_window: int = 30,
    ):
        super().__init__()
        self.input_proj = nn.Linear(input_size, d_model)
        self.pos_enc = PositionalEncoding(d_model, max_len=lookback_window + 100)
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=d_model, nhead=num_heads, batch_first=True, dim_feedforward=d_model * 4
        )
        self.encoder = nn.TransformerEncoder(encoder_layer, num_layers=num_layers)
        self.fc = nn.Linear(d_model, 1)
        self.lookback_window = lookback_window

    def forward(self, x):
        x = self.input_proj(x)
        x = self.pos_enc(x)
        x = self.encoder(x)
        out = self.fc(x[:, -1, :])
        return out.squeeze(-1)


# ═══════════════════════════════════════════════════════════════════════════
# Model factory
# ═══════════════════════════════════════════════════════════════════════════

def _build_model(model_type: str, input_size: int, config: dict) -> nn.Module:
    hidden = config.get("hidden_size", 64)
    layers = config.get("num_layers", 2)
    lookback = config.get("lookback_window", 30)

    if model_type == "LSTM":
        return LSTMForecaster(input_size, hidden, layers)
    elif model_type == "GRU":
        return GRUForecaster(input_size, hidden, layers)
    elif model_type == "TRANSFORMER":
        return TransformerForecaster(
            input_size=input_size,
            d_model=hidden,
            num_heads=config.get("num_heads", 4),
            num_layers=layers,
            lookback_window=lookback,
        )
    else:
        raise ValueError(f"Unknown deep model type: {model_type}")


# ═══════════════════════════════════════════════════════════════════════════
# Training
# ═══════════════════════════════════════════════════════════════════════════

def train_deep_model(
    train_values: np.ndarray,
    model_type: str,
    config: dict,
) -> tuple[nn.Module, MinMaxScaler, dict]:
    """
    Train a deep learning model.

    Parameters
    ----------
    train_values : 1-D numpy array of target values (already split)
    model_type   : LSTM, GRU, or TRANSFORMER
    config       : dict with optional keys: lookback_window, hidden_size,
                   num_layers, num_heads, epochs, learning_rate, batch_size

    Returns
    -------
    (trained_model, scaler, training_info)
    """
    lookback = config.get("lookback_window", 30)
    epochs = config.get("epochs", 50)
    lr = config.get("learning_rate", 0.001)
    batch_size = config.get("batch_size", 32)

    # Normalise
    scaler = MinMaxScaler()
    scaled = scaler.fit_transform(train_values.reshape(-1, 1)).flatten()

    X, y = create_sequences(scaled, lookback)
    input_size = X.shape[2] if X.ndim == 3 else 1

    X_tensor = torch.tensor(X, dtype=torch.float32)
    y_tensor = torch.tensor(y, dtype=torch.float32)

    dataset = torch.utils.data.TensorDataset(X_tensor, y_tensor)
    loader = torch.utils.data.DataLoader(dataset, batch_size=batch_size, shuffle=False)

    model = _build_model(model_type, input_size, config)
    optimiser = torch.optim.Adam(model.parameters(), lr=lr)
    criterion = nn.MSELoss()

    model.train()
    for epoch in range(1, epochs + 1):
        epoch_loss = 0.0
        for xb, yb in loader:
            optimiser.zero_grad()
            pred = model(xb)
            loss = criterion(pred, yb)
            loss.backward()
            optimiser.step()
            epoch_loss += loss.item() * xb.size(0)
        if epoch % max(1, epochs // 5) == 0 or epoch == 1:
            logger.info(
                "%s epoch %d/%d  loss=%.6f", model_type, epoch, epochs, epoch_loss / len(dataset)
            )

    model.eval()
    return model, scaler, {"final_loss": epoch_loss / len(dataset)}


# ═══════════════════════════════════════════════════════════════════════════
# Prediction
# ═══════════════════════════════════════════════════════════════════════════

def predict_deep_model(
    model: nn.Module,
    last_window: np.ndarray,
    scaler: MinMaxScaler,
    horizon: int,
) -> np.ndarray:
    """
    Iteratively predict `horizon` steps into the future.

    Parameters
    ----------
    model       : trained PyTorch model
    last_window : the last `lookback_window` scaled values (1-D)
    scaler      : fitted MinMaxScaler for inverse transform
    horizon     : how many steps to forecast

    Returns
    -------
    np.ndarray of shape (horizon,) in original scale
    """
    model.eval()
    window = last_window.copy().astype(np.float32)
    preds = []

    with torch.no_grad():
        for _ in range(horizon):
            x = torch.tensor(window.reshape(1, -1, 1), dtype=torch.float32)
            yhat = model(x).item()
            preds.append(yhat)
            window = np.append(window[1:], yhat)

    preds_arr = np.array(preds).reshape(-1, 1)
    return scaler.inverse_transform(preds_arr).flatten()
