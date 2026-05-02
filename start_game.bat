@echo off
cd /d "%~dp0"
set "PS=%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe"

if not exist "%PS%" (
  echo Windows PowerShell not found.
  pause
  exit /b 1
)

"%PS%" -NoProfile -ExecutionPolicy Bypass -File "%~dp0game.ps1"

if errorlevel 1 (
  echo.
  echo Game crashed or could not start. Copy the error above and send it here.
  pause
)
