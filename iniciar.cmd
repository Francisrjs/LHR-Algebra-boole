@echo off
setlocal
cd /d "%~dp0"
if not exist ".venv\Scripts\python.exe" (
  echo Ejecuta setup.cmd primero.
  exit /b 1
)
".venv\Scripts\python.exe" launch.py %*
if errorlevel 1 pause
