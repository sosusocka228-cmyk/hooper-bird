@echo off
cd /d "%~dp0"
"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -ExecutionPolicy Bypass -File "%~dp0web_server.ps1"
if errorlevel 1 (
  echo.
  echo Could not start the localhost server.
  echo Send the error above here.
  pause
)
