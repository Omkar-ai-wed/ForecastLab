"""
FastAPI application entry point.
- CORS middleware for frontend access
- Lifespan hook to initialise dirs and database
- Global exception handling
"""
import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.database import create_tables
from app.routes import anomalies, datasets, forecasting, models_route, training

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("forecast_lab")


# ---------------------------------------------------------------------------
# Lifespan – runs once on startup
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(_app: FastAPI):
    logger.info("Starting Forecast Lab API …")
    os.makedirs("data", exist_ok=True)
    os.makedirs("models_store", exist_ok=True)
    create_tables()
    logger.info("Database tables ready.")
    yield
    logger.info("Shutting down Forecast Lab API.")


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(
    title="Forecast Lab API",
    description="Time-series forecasting backend – classical & deep-learning models",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS – allow the Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(datasets.router, tags=["Datasets"])
app.include_router(training.router, tags=["Training"])
app.include_router(forecasting.router, tags=["Forecasting"])
app.include_router(models_route.router, tags=["Models"])
app.include_router(anomalies.router, tags=["Anomalies"])


# ---------------------------------------------------------------------------
# Global exception handler
# ---------------------------------------------------------------------------
@app.exception_handler(Exception)
async def global_exception_handler(_request: Request, exc: Exception):
    logger.exception("Unhandled exception: %s", exc)
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"},
    )


@app.get("/", tags=["Health"])
async def health_check():
    return {"status": "ok", "service": "Forecast Lab API"}
