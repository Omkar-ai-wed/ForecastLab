# ForecastLab

A modern, professional time-series forecasting suite—unifying a rich analytics dashboard (Google AI Studio Edition) with a robust FastAPI backend. Designed for energy, demand and financial data analysts seeking high-precision predictions, interactive visualization, and fully local execution.

---

## 💡 Overview

**ForecastLab** empowers data scientists, ML engineers, and industry professionals with a seamless desktop environment for:

- Custom dataset upload
- Advanced pattern visualizations
- State-of-the-art model training (Transformer, LSTM, GRU, Prophet, ARIMA)
- Forecasting with confidence intervals and error analysis
- Secure API management

From ingestion to insight—ForecastLab provides a one-stop platform with a Studio OS-inspired interface and battle-tested Python FastAPI backend.

---

## ✨ Feature Highlights

### Frontend (React, AI Studio Edition)

- **Interactive Onboarding:** Start with a clean slate, guided by an engaging zero-data workflow.
- **Data Management:** Drag & drop CSVs, auto-detects timeseries structure, and exports cataloged regional datasets.
- **Visualization:** Lightning-fast rendering of thousands of points, dynamic graph palettes, anomaly overlays, and statistical summaries.
- **Model Training:** Visual interface for configuring, running, and tracking ML experiments with flexible architectures.
- **Evaluation:** Inspect forecast bands, residuals, and real-time metrics (RMSE, MAE, MSE, MAPE).
- **System Preferences:** Easily update interface settings, API keys (Gemini, weather, pricing), and user roles.

### Backend (Python, FastAPI)

- **REST API** for all forecasting tasks.
- **Supported Models:** ARIMA, Prophet, LSTM, GRU, Transformer.
- **Endpoints:** Train models, upload/list datasets, forecast, metric download, anomaly detection.
- **Easy Setup:** Python virtual environment, quick-start server.
- **Interactive Docs:** OpenAPI at `/docs`.

---

## 🛠️ Tech Stack

- **Frontend:** React 19, TypeScript, Vite 6, Tailwind CSS v4, Recharts, Motion, Lucide
- **Backend:** Python 3.x, FastAPI, Uvicorn, PyTorch, statsmodels, Prophet, SQLite, SQLAlchemy

### Repository Language Composition

- **TypeScript:** 66.2%
- **Python:** 31.9%
- **CSS:** 1.1%
- **Other:** 0.8%

---

## 🚀 Getting Started

### Prerequisites

- **Frontend:** Node.js v18+
- **Backend:** Python 3.8+ (virtualenv recommended), pip

### Frontend Setup

1. Clone this repo and open the project directory.
2. Install dependencies:
   ```sh
   npm install
   ```
3. Configure AI and API provider keys:
   - Copy `.env.example` to `.env.local`
   - Paste your Gemini API key or others as needed
4. Launch development server:
   ```sh
   npm run dev
   ```
5. App runs at [http://localhost:3000](http://localhost:3000)

### Backend Setup

1. Enter the backend folder:
   ```sh
   cd backend
   ```
2. Create a virtual environment & activate it:
   - **Windows**:
     ```sh
     python -m venv venv
     venv\Scripts\activate
     ```
   - **macOS/Linux**:
     ```sh
     python3 -m venv venv
     source venv/bin/activate
     ```
3. Install Python dependencies:
   ```sh
   pip install -r requirements.txt
   ```
4. Launch FastAPI server:
   ```sh
   python run.py
   ```
5. API docs are at [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 📁 Project Structure

```text
ForecastLab/
├── src/                 # Frontend source code
│   ├── components/
│   ├── lib/
│   ├── ... 
├── backend/             # FastAPI backend
│   ├── app/
│   ├── data/
│   ├── models_store/
├── ...
```

---

## 🔌 Key Links

- **App template (Google AI Studio):** [View in AI Studio](https://ai.studio/apps/29e5b9f9-ff43-4c93-9537-c6d41a4c4e7e)
- **Get Gemini API Key:** [Get Key](https://aistudio.google.com/apikey)

---

## 📝 License

This project is licensed under the [Apache License 2.0](./LICENSE). Freely use, modify, and distribute for personal or commercial projects.

---

Modern, transparent, and built for scale—ForecastLab brings elite time series forecasting to your desktop!
