# Branch Comparison Script for World Engine
# Compares main branch with feature/integrated-campaign-system

Write-Host "🔍 World Engine Branch Comparison" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Current branch info
Write-Host "📍 Current Branch:" -ForegroundColor Yellow
git branch --show-current
Write-Host ""

# Compare commits
Write-Host "📊 Commit Differences:" -ForegroundColor Yellow
Write-Host "Main branch latest commits:" -ForegroundColor Green
git log origin/main --oneline -5
Write-Host ""
Write-Host "Feature branch latest commits:" -ForegroundColor Magenta
git log origin/feature/integrated-campaign-system --oneline -5
Write-Host ""

# File differences
Write-Host "📁 File Differences between branches:" -ForegroundColor Yellow
git diff --name-status origin/main origin/feature/integrated-campaign-system | Select-Object -First 30
Write-Host ""

# Count differences
$diffCount = (git diff --name-only origin/main origin/feature/integrated-campaign-system | Measure-Object).Count
Write-Host "Total files changed: $diffCount" -ForegroundColor Cyan
Write-Host ""

# Show src/ structure differences
Write-Host "📂 Source Directory Structure Comparison:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Main branch (YOUR PC):" -ForegroundColor Green
git ls-tree -r --name-only origin/main src/ | Sort-Object | Select-Object -First 20
Write-Host "... (showing first 20 files)" -ForegroundColor Gray
Write-Host ""

Write-Host "Feature branch (BROTHER PC):" -ForegroundColor Magenta
git ls-tree -r --name-only origin/feature/integrated-campaign-system src/ | Sort-Object | Select-Object -First 20
Write-Host "... (showing first 20 files)" -ForegroundColor Gray
Write-Host ""

# Key file differences
Write-Host "🔑 Key Files Only in Feature Branch:" -ForegroundColor Yellow
git diff --name-only --diff-filter=A origin/main origin/feature/integrated-campaign-system | Select-String "src/" | Select-Object -First 15
Write-Host ""

Write-Host "🔑 Key Files Only in Main Branch:" -ForegroundColor Yellow
git diff --name-only --diff-filter=D origin/main origin/feature/integrated-campaign-system | Select-String "src/" | Select-Object -First 15
Write-Host ""

# Branch divergence point
Write-Host "🌳 Branch Divergence Point:" -ForegroundColor Yellow
$mergeBase = git merge-base origin/main origin/feature/integrated-campaign-system
Write-Host "Common ancestor: $mergeBase"
git log --oneline -1 $mergeBase
Write-Host ""

# Commits since divergence
$mainCommits = (git log --oneline $mergeBase..origin/main | Measure-Object).Count
$featureCommits = (git log --oneline $mergeBase..origin/feature/integrated-campaign-system | Measure-Object).Count

Write-Host "Commits since divergence:" -ForegroundColor Cyan
Write-Host "  Main branch: $mainCommits commits ahead" -ForegroundColor Green
Write-Host "  Feature branch: $featureCommits commits ahead" -ForegroundColor Magenta
Write-Host ""

Write-Host "✅ Comparison complete!" -ForegroundColor Green
Write-Host ""
Write-Host "💡 To sync both PCs:" -ForegroundColor Yellow
Write-Host "   1. Decide which branch to standardize on"
Write-Host "   2. Both checkout the same branch: git checkout [branch-name]"
Write-Host "   3. Pull latest: git pull origin [branch-name]"
Write-Host "   4. Clean install: npm ci"
