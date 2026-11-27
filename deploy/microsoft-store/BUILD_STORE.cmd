@echo off
setlocal
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Build.ps1" %*
if errorlevel 1 (
  echo BUILD FAILED. Review the error above.
  pause
  exit /b 1
)
pause
