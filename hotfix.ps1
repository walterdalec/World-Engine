# World Engine Hotfix Script
# For quick patch releases

param(
    [Parameter(Mandatory=$true)]
    [string]$Description
)

Write-Host "🩹 World Engine Hotfix Manager" -ForegroundColor Red
Write-Host "==============================" -ForegroundColor Red

# Get current version
$currentVersion = (Get-Content package.json | ConvertFrom-Json).version
Write-Host "Current version: $currentVersion" -ForegroundColor Yellow

try {
    # Auto-bump patch version
    Write-Host "`n📦 Bumping patch version..." -ForegroundColor Green
    npm version patch --no-git-tag-version
    
    if ($LASTEXITCODE -ne 0) {
        throw "Version bump failed"
    }
    
    # Get new version
    $newVersion = (Get-Content package.json | ConvertFrom-Json).version
    Write-Host "New version: $newVersion (HOTFIX)" -ForegroundColor Red
    
    # Create hotfix notes
    $hotfixFile = "hotfix-$newVersion.md"
    @"
# HOTFIX v$newVersion

## Issue Fixed
$Description

## Build Info
- Hotfix Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
- Previous Version: $currentVersion
- Type: Critical patch

## Auto-Update
This hotfix will be automatically delivered to existing installations.
"@ | Out-File -FilePath $hotfixFile -Encoding UTF8
    
    Write-Host "Hotfix notes created: $hotfixFile" -ForegroundColor Cyan
    
    # Quick build and test
    Write-Host "`n🔨 Building hotfix..." -ForegroundColor Green
    npm run build
    
    if ($LASTEXITCODE -ne 0) {
        throw "Build failed"
    }
    
    # Test Electron app quickly
    Write-Host "`n🧪 Testing hotfix..." -ForegroundColor Green
    Start-Process -FilePath "npm" -ArgumentList "run", "electron:build" -Wait -NoNewWindow
    
    # Commit with hotfix message
    Write-Host "`n💾 Committing hotfix..." -ForegroundColor Green
    git add .
    $commitMessage = "HOTFIX v{0}: {1}" -f $newVersion, $Description
    git commit -m $commitMessage
    if ($LASTEXITCODE -ne 0) {
        throw "Git commit failed"
    }
    git tag "v$newVersion"
    
    # Ask for confirmation before pushing
    Write-Host "`n⚠️  Ready to release hotfix v$newVersion" -ForegroundColor Yellow
    $confirm = Read-Host "Push to production? (y/N)"
    
    if ($confirm -eq 'y' -or $confirm -eq 'Y') {
        # Push and release
        git push origin main
        git push origin "v$newVersion"
        
        Write-Host "`n🚀 Building and releasing hotfix..." -ForegroundColor Green
        npm run release:win
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "`n✅ Hotfix released successfully!" -ForegroundColor Green
            Write-Host "Version: $newVersion" -ForegroundColor Red
            Write-Host "Auto-update will deliver this to existing users" -ForegroundColor Cyan
        } else {
            throw "Release failed"
        }
    } else {
        Write-Host "`n⏸️  Hotfix prepared but not released" -ForegroundColor Yellow
        Write-Host "Run 'git push origin main && git push origin v$newVersion' when ready" -ForegroundColor Cyan
    }
    
} catch {
    Write-Host "`n❌ Hotfix failed: $_" -ForegroundColor Red
    Write-Host "Rolling back changes..." -ForegroundColor Yellow
    
    # Rollback
    git checkout -- package.json package-lock.json
    git reset --hard HEAD~1 2>$null
    
    exit 1
}

Write-Host "`nPress any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
