@echo off
title Capstone Website Launcher
echo ====================================================
echo Starting Capstone Website (Backend + Frontend)...
echo ====================================================
echo.

cd /d "%~dp0"

echo [1/2] Launching Django Backend at http://127.0.0.1:8000 ...
start "Capstone Django Backend" cmd /k "cd /d "%~dp0" && .\venv\Scripts\python.exe backend\manage.py runserver"

echo [2/2] Launching React Frontend at http://localhost:5173 ...
start "Capstone Frontend" cmd /k "cd /d "%~dp0" && npm run dev"

echo.
echo ====================================================
echo Both servers are starting up!
echo Opening browser in 3 seconds...
echo ====================================================
timeout /t 3 >nul
start http://localhost:5173

