@echo off
setlocal
cd /d "%~dp0"
if not exist ".venv\Scripts\python.exe" (
 echo Ejecuta setup.cmd primero.
 exit /b 1
)
".venv\Scripts\python.exe" -m pytest -q
if errorlevel 1 exit /b 1
call npm.cmd --prefix frontend test
if errorlevel 1 exit /b 1
call npm.cmd --prefix frontend run build
if errorlevel 1 exit /b 1
echo Pruebas matematicas, frontend y compilacion correctas.
echo Para verificar Chrome, inicia ControlLab y ejecuta npm.cmd --prefix e2e test.
