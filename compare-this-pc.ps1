# Folder Comparison Helper Script - Simple Version
# Run this on BOTH PCs to generate comparison files

Write-Host "Folder Structure Comparison Tool" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$outputDir = "comparison-$timestamp"

# Create output directory
New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
Write-Host "Output directory: $outputDir" -ForegroundColor Green
Write-Host ""

# 1. Git Status
Write-Host "1. Checking Git status..." -ForegroundColor Yellow
git status --porcelain > "$outputDir/git-status.txt"
git log --oneline -50 > "$outputDir/git-log.txt"
git log --branches --not --remotes --oneline > "$outputDir/unpushed.txt"
git stash list > "$outputDir/stash.txt"
Write-Host "   Done" -ForegroundColor Green

# 2. File Lists
Write-Host "2. Generating file lists..." -ForegroundColor Yellow
git ls-files | Sort-Object > "$outputDir/tracked-files.txt"
Get-ChildItem src/ -Directory -Name | Sort-Object > "$outputDir/src-folders.txt"
Write-Host "   Done" -ForegroundColor Green

# 3. Canvas Systems Check
Write-Host "3. Checking Canvas systems..." -ForegroundColor Yellow
$check = @()
$check += "Canvas System Check"
$check += "==================="
$check += ""
$check += "Canvas 10 (Party): " + (Test-Path "src/party/")
$check += "Canvas 11 (Progression): " + (Test-Path "src/progression/")
$check += "Canvas 12 (Economy): " + (Test-Path "src/econ/")
$check += "Canvas 13 (Encounters): " + (Test-Path "src/encounters/")
$check += "Canvas 14 (Battle): " + (Test-Path "src/battle/")
$check += ""
$check += "Game Engine: " + (Test-Path "src/engine/")
$check += "Content Packs: " + (Test-Path "src/packs/")
$check += "State System: " + (Test-Path "src/state/")
$check += "World Gen: " + (Test-Path "src/world/")
$check += ""
$check += "Brigandine Battle: " + (Test-Path "src/features/battle/")
$check | Out-File "$outputDir/system-check.txt"
Write-Host "   Done" -ForegroundColor Green

# 4. Environment Info
Write-Host "4. Collecting environment info..." -ForegroundColor Yellow
@"
Node: $(node --version)
NPM: $(npm --version)
Git: $(git --version)
Directory: $PWD
Date: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
"@ > "$outputDir/environment.txt"
Write-Host "   Done" -ForegroundColor Green

# 5. Package versions
Write-Host "5. Checking npm packages..." -ForegroundColor Yellow
npm list --depth=0 > "$outputDir/packages.txt" 2>&1
Write-Host "   Done" -ForegroundColor Green

# Summary
Write-Host ""
Write-Host "=================================" -ForegroundColor Green
Write-Host "COMPLETED" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host ""
Write-Host "Output folder: $outputDir" -ForegroundColor Cyan
Write-Host ""
Write-Host "Files created:" -ForegroundColor Yellow
Get-ChildItem $outputDir -File | ForEach-Object {
    Write-Host "  - $($_.Name)"
}
Write-Host ""

# Quick status check
Write-Host "Quick Status Check:" -ForegroundColor Yellow
Write-Host ""

$uncommitted = (git status --porcelain | Measure-Object -Line).Lines
if ($uncommitted -gt 0) {
    Write-Host "  WARNING: $uncommitted uncommitted files" -ForegroundColor Red
} else {
    Write-Host "  OK: No uncommitted changes" -ForegroundColor Green
}

$unpushed = (git log --branches --not --remotes --oneline | Measure-Object -Line).Lines
if ($unpushed -gt 0) {
    Write-Host "  WARNING: $unpushed unpushed commits" -ForegroundColor Red
} else {
    Write-Host "  OK: No unpushed commits" -ForegroundColor Green
}

$stashed = (git stash list | Measure-Object -Line).Lines
if ($stashed -gt 0) {
    Write-Host "  WARNING: $stashed stashed changes" -ForegroundColor Red
} else {
    Write-Host "  OK: No stashed changes" -ForegroundColor Green
}

Write-Host ""
Write-Host "Next: Run this script on brother's PC too" -ForegroundColor Cyan
