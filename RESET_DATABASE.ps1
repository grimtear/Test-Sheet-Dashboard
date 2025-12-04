# Script to reset the database with new schema
Write-Host "Resetting database with updated schema..." -ForegroundColor Yellow

# Find and delete any existing database files
$dbFiles = Get-ChildItem -Path "." -Filter "database.sqlite*" -Recurse
if ($dbFiles) {
    Write-Host "Found existing database files:" -ForegroundColor Cyan
    $dbFiles | ForEach-Object { Write-Host "  - $($_.FullName)" }
    
    Write-Host "`nDeleting old database files..." -ForegroundColor Red
    $dbFiles | Remove-Item -Force
    Write-Host "Database files deleted!" -ForegroundColor Green
} else {
    Write-Host "No existing database files found." -ForegroundColor Cyan
}

Write-Host "`n✅ Database reset complete!" -ForegroundColor Green
Write-Host "Now restart your server to create the new database with all fields." -ForegroundColor Yellow
