@echo off
cd /d "%~dp0"
title NAE TestSheet - Express Server (Port 5002)
echo ========================================
echo NAE IT Technology Test Sheet
echo Express API Server
echo ========================================
echo.
echo Server will start on:
echo   Global:  http://192.168.1.194:5002
echo   Network: http://192.168.1.194:5002
echo.
echo Press Ctrl+C to stop
echo ========================================
echo.

:start
npx tsx server/index.ts
if errorlevel 1 (
    echo.
    echo Server stopped with error code %errorlevel%
    echo.
    choice /C YN /M "Restart server"
    if errorlevel 2 goto end
    goto start
)

:end
echo.
echo Server shut down
pause
