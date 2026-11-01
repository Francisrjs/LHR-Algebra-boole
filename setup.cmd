@echo off
setlocal
cd /d "%~dp0"
where python >nul 2>nul
if errorlevel 1 (
  echo Instala Python 3.11 o superior y agregalo al PATH.
  exit /b 1
)
if not exist ".venv\Scripts\python.exe" python -m venv .venv
if errorlevel 1 exit /b 1
".venv\Scripts\python.exe" -m pip install -r requirements.txt
if errorlevel 1 exit /b 1
where npm.cmd >nul 2>nul
if errorlevel 1 (
  echo Instala Node.js LTS para compilar la interfaz.
  exit /b 1
)
pushd frontend
call npm.cmd ci
if errorlevel 1 (popd & exit /b 1)
call npm.cmd run build
if errorlevel 1 (popd & exit /b 1)
popd
echo Instalacion completa. Ejecuta iniciar.cmd.
