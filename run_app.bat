@echo off
echo Starting Forecast Lab...

:: Start Backend
start cmd /k "cd backend && venv\Scripts\activate && python run.py"

:: Start Frontend
start cmd /k "npm run dev"

echo Backend and Frontend are starting in separate windows...
echo API is available at http://localhost:8000
echo Frontend is available at http://localhost:3000
