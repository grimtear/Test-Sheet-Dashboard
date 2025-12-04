@echo off
cd /d "%~dp0"
title NAE TestSheet - Vite Dev Server (Port 5173)
echo ========================================
echo NAE IT Technology Test Sheet
echo Vite Development Server
echo ========================================
echo.
echo Server will start on:
echo   Global:  http://192.168.1.194:5173
echo   Network: http://192.168.1.194:5173
echo.
echo Press Ctrl+C to stop
echo ========================================
echo.

npm run dev:client
