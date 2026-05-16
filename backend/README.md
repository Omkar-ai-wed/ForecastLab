# Forecast Lab — FastAPI Backend

A production-quality time-series forecasting API supporting classical (ARIMA, Prophet) and deep learning (LSTM, GRU, Transformer) models.

## Quick Start

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Start the server
python run.py
```

The API will be available at **http://localhost:8000**  
Interactive docs at **http://localhost:8000/docs**

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/datasets/upload` | Upload a CSV dataset |
| `GET` | `/datasets` | List all datasets |
| `POST` | `/train` | Train a model |
| `GET` | `/models` | List all trained models |
| `POST` | `/forecast` | Generate forecast |
| `GET` | `/forecast/download/{model_id}` | Download forecast CSV |
| `GET` | `/metrics/{model_id}` | Get model metrics |
| `GET` | `/anomalies/{dataset_id}` | Detect anomalies |

## Supported Models

- **ARIMA** — Auto-Regressive Integrated Moving Average (statsmodels)
- **PROPHET** — Facebook Prophet
- **LSTM** — Long Short-Term Memory (PyTorch)
- **GRU** — Gated Recurrent Unit (PyTorch)
- **TRANSFORMER** — Encoder-based Transformer (PyTorch)

## Project Structure

```
backend/
├── run.py                  # Uvicorn entry point
├── requirements.txt
├── app/
│   ├── main.py             # FastAPI app, CORS, lifespan
│   ├── database.py         # SQLite + SQLAlchemy
│   ├── routes/             # API endpoint handlers
│   ├── schemas/            # Pydantic request/response models
│   ├── services/           # Business logic (training, forecasting)
│   └── utils/              # Metrics, model I/O, sequences
├── data/                   # Uploaded CSVs
└── models_store/           # Saved model artifacts
```
