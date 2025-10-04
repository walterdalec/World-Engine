# World Engine - Electron Build Script
# This script builds the desktop version of World Engine
# Note: This must be run on Windows to create Windows installers

Write-Host "Building World Engine Desktop App..." -ForegroundColor Green

# Check if running on Windows
if ($PSVersionTable.Platform -ne "Win32NT" -and $PSVersionTable.PSEdition -ne "Desktop" -and $PSVersionTable.Platform -ne $null) {
    Write-Host "⚠️  Warning: Building Windows installers on non-Windows platforms requires Wine." -ForegroundColor Yellow
    Write-Host "    It's recommended to run this script on Windows for best results." -ForegroundColor Yellow
    Write-Host ""
}

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
        Write-Host ""
        Write-Host "Common issues:" -ForegroundColor Yellow
        Write-Host "  • On Linux/Mac: Wine must be installed to create Windows installers" -ForegroundColor White
        Write-Host "  • Icon file must be at least 256x256 pixels (fixed in public/icon.ico)" -ForegroundColor White
        Write-Host "  • Run on Windows for native Windows installer creation" -ForegroundColor White
    }
} else {
    Write-Host "React build failed!" -ForegroundColor Red
}

Write-Host "Press any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")