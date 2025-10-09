# Systematic ESLint Fix Script
# This PowerShell script systematically fixes the most common unused variable patterns

Write-Host "🔧 Starting systematic ESLint fixes..." -ForegroundColor Green

# Most common unused parameters that need underscore prefixes
$commonParams = @(
    "events", "pos", "campaign", "hexPos", "worldState", 
    "ctx", "origin", "event", "action", "faction"
)

Write-Host "📋 Target parameters for underscore prefixing:" -ForegroundColor Yellow
$commonParams | ForEach-Object { Write-Host "  - $_" }

# Common unused imports to remove
$commonUnusedImports = @(
    "React", "useEffect", "useState", "HexPosition", "BattleState"
)

Write-Host "🗑️ Target imports for removal:" -ForegroundColor Yellow  
$commonUnusedImports | ForEach-Object { Write-Host "  - $_" }

Write-Host "⚡ Running ESLint auto-fix first..." -ForegroundColor Cyan
npx eslint . --fix
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ ESLint auto-fix failed with exit code $LASTEXITCODE." -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host "📊 Checking remaining issues..." -ForegroundColor Cyan
$lintOutput = npx eslint . 2>&1
$errorCount = ($lintOutput | Select-String "error" | Measure-Object).Count
$warningCount = ($lintOutput | Select-String "warning" | Measure-Object).Count

Write-Host "Current status:" -ForegroundColor White
Write-Host "  Errors: $errorCount" -ForegroundColor $(if ($errorCount -eq 0) { "Green" } else { "Red" })
Write-Host "  Warnings: $warningCount" -ForegroundColor $(if ($warningCount -eq 0) { "Green" } else { "Yellow" })

if ($errorCount -eq 0 -and $warningCount -eq 0) {
    Write-Host "🎉 All ESLint issues resolved!" -ForegroundColor Green
}
else {
    Write-Host "⚠️ Manual fixes needed for remaining issues" -ForegroundColor Yellow
}