# World Engine - Electron Build Script
# This script builds the desktop version of World Engine

Write-Host "Building World Engine Desktop App..." -ForegroundColor Green

# Build the React app first
Write-Host "Building React app..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "React build successful!" -ForegroundColor Green
    
    # Build Windows installer
    Write-Host "Building Windows installer..." -ForegroundColor Yellow
    npm run dist:win
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Desktop app built successfully!" -ForegroundColor Green
        Write-Host "Check the 'dist' folder for the installer." -ForegroundColor Cyan
        
        # Open the dist folder
        if (Test-Path "dist") {
            Start-Process "dist"
        }
    } else {
        Write-Host "Failed to build desktop app!" -ForegroundColor Red
    }
} else {
    Write-Host "React build failed!" -ForegroundColor Red
}

Write-Host "Press any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")