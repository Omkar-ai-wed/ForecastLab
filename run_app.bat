@echo off
echo Starting Forecast Lab...

:: Start Backend
start cmd /k "cd backend && venv\Scripts\activate && uvicorn main:app --reload --port 8000"

:: Start Frontend
start cmd /k "npm run dev"

echo Backend and Frontend are starting in separate windows...
echo API is available at http://localhost:8000
echo Frontend is available at http://localhost:5173
