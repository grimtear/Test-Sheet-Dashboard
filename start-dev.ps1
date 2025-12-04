# TestSheet Development Server PowerShell Script
# Run this script to start both development servers

Write-Host "========================================" -ForegroundColor Green
Write-Host "TestSheet Development Environment" -ForegroundColor Green  
Write-Host "========================================" -ForegroundColor Green

# Get script directory and change to it
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

Write-Host "Current directory: $(Get-Location)" -ForegroundColor Yellow

# Check for required files
if (-not (Test-Path "server\index.ts")) {
    Write-Host "ERROR: server\index.ts not found!" -ForegroundColor Red
    Write-Host "Current directory: $(Get-Location)" -ForegroundColor Red
    Write-Host "Make sure you're in the TestSheet project folder." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

if (-not (Test-Path "package.json")) {
    Write-Host "ERROR: package.json not found!" -ForegroundColor Red
    Write-Host "This doesn't appear to be a Node.js project." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Files verified successfully." -ForegroundColor Green
Write-Host ""

# Kill any existing node processes
Write-Host "Stopping any running servers..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Set environment variables
$env:NODE_ENV = "development"
$env:SESSION_SECRET = "local-dev-secret-key-change-in-production"
$env:HOST = "0.0.0.0"
$env:PORT = "5002"
$env:GOOGLE_SHEET_ID = "1_GpYih_KpE4N0OpmY231780v9aga5DaqtLh68xoX6KE"
$env:GOOGLE_SHEET_RANGE = "Test Sheets!A:ZZ"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Starting Development Servers" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "[1] Express API Server - Port 5002" -ForegroundColor Cyan
Write-Host "[2] Vite Dev Server   - Port 5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "Access your app at:" -ForegroundColor Yellow
Write-Host "  Global:  http://192.168.1.194:5173" -ForegroundColor Cyan
Write-Host "  Network: http://192.168.1.194:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "Each server will open in a separate window" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Start Express API Server in new PowerShell window
Write-Host "Starting Express API Server..." -ForegroundColor Yellow
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "Set-Location '$ScriptDir'; `$env:NODE_ENV='development'; npx tsx server/index.ts" -WindowStyle Normal

# Wait for server to start
Start-Sleep -Seconds 3

# Start Vite Client in new PowerShell window
Write-Host "Starting Vite Client Server..." -ForegroundColor Yellow
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "Set-Location '$ScriptDir'; npm run dev:client" -WindowStyle Normal

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Both servers are starting..." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Close the server windows to stop them" -ForegroundColor Yellow
Write-Host ""
Read-Host "Press Enter to close this window"
