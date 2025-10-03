# World Engine Release Script
# Automates version bumping, building, and releasing

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("patch", "minor", "major", "prerelease")]
    [string]$VersionType,
    
    [string]$PrereleaseId = "beta",
    
    [switch]$Draft,
    
    [string]$ReleaseNotes = ""
)

Write-Host "🚀 World Engine Release Manager" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Get current version
$currentVersion = (Get-Content package.json | ConvertFrom-Json).version
Write-Host "Current version: $currentVersion" -ForegroundColor Yellow

try {
    # Bump version
    Write-Host "`n📦 Bumping version ($VersionType)..." -ForegroundColor Green
    if ($VersionType -eq "prerelease") {
        npm version $VersionType --preid=$PrereleaseId
    } else {
        npm version $VersionType
    }
    
    if ($LASTEXITCODE -ne 0) {
        throw "Version bump failed"
    }
    
    # Get new version
    $newVersion = (Get-Content package.json | ConvertFrom-Json).version
    Write-Host "New version: $newVersion" -ForegroundColor Green
    
    # Build the application
    Write-Host "`n🔨 Building application..." -ForegroundColor Green
    npm run build
    
    if ($LASTEXITCODE -ne 0) {
        throw "Build failed"
    }
    
    # Create release notes file if provided
    if ($ReleaseNotes) {
        $releaseNotesFile = "release-notes-$newVersion.md"
        @"
# World Engine v$newVersion

## Changes
$ReleaseNotes

## Build Info
- Build Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
- Electron Version: $(node -e "console.log(require('electron/package.json').version)")
- Node Version: $(node --version)

## Installation
Download the installer for your platform from the releases page.

## Auto-Updates
This version includes auto-update functionality. The app will check for updates automatically and notify you when new versions are available.
"@ | Out-File -FilePath $releaseNotesFile -Encoding UTF8
        
        Write-Host "Release notes created: $releaseNotesFile" -ForegroundColor Cyan
    }
    
    # Build distributables
    Write-Host "`n📦 Building distributables..." -ForegroundColor Green
    
    if ($Draft) {
        Write-Host "Creating draft release..." -ForegroundColor Yellow
        npm run release:draft
    } else {
        Write-Host "Creating public release..." -ForegroundColor Yellow
        npm run release:win
    }
    
    if ($LASTEXITCODE -ne 0) {
        throw "Release build failed"
    }
    
    # Commit and tag
    Write-Host "`n🏷️ Creating git tag and pushing..." -ForegroundColor Green
    git add .
    git commit -m "Release v$newVersion" --allow-empty
    git tag "v$newVersion"
    git push origin main
    git push origin "v$newVersion"
    
    if ($LASTEXITCODE -ne 0) {
        throw "Git operations failed"
    }
    
    Write-Host "`n✅ Release completed successfully!" -ForegroundColor Green
    Write-Host "Version: $newVersion" -ForegroundColor Cyan
    Write-Host "Distributables created in: ./dist/" -ForegroundColor Cyan
    
    # Open dist folder
    if (Test-Path "dist") {
        Start-Process "dist"
    }
    
    # Show next steps
    Write-Host "`n📋 Next Steps:" -ForegroundColor Yellow
    Write-Host "1. Check the ./dist/ folder for installers" -ForegroundColor White
    Write-Host "2. Test the installer on a clean machine" -ForegroundColor White
    Write-Host "3. Share with your brothers for testing" -ForegroundColor White
    Write-Host "4. Monitor auto-update functionality" -ForegroundColor White
    
} catch {
    Write-Host "`n❌ Release failed: $_" -ForegroundColor Red
    Write-Host "Rolling back version change..." -ForegroundColor Yellow
    
    # Rollback version if it was changed
    git checkout -- package.json package-lock.json
    
    exit 1
}

Write-Host "`nPress any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")