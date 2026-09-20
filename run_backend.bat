@echo off
title GatiMarg AI - Backend Server (Port 8000)
cd /d "%~dp0"
echo ===================================================
echo Starting GatiMarg AI Backend (FastAPI on Port 8000)
echo Swagger Docs: http://127.0.0.1:8000/docs
echo Health Check: http://127.0.0.1:8000/api/health
echo ===================================================
call ..\.venv\Scripts\activate.bat 2>nul || call .venv\Scripts\activate.bat 2>nul
uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
pause
