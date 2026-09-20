@echo off
title GatiMarg AI - Frontend Server (Port 3000)
cd /d "%~dp0"
echo ===================================================
echo Starting GatiMarg AI Frontend (Port 3000)
echo UI URL: http://localhost:3000
echo ===================================================
python -m http.server 3000 --directory frontend
pause
