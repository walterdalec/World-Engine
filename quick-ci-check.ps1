# Quick CI Check - Find what's breaking the workflow

Write-Host "Checking likely CI failure points..." -ForegroundColor Cyan

# Check 1: TypeScript compilation
Write-Host "`n[CHECK 1] TypeScript compilation..." -ForegroundColor Yellow
$tsResult = & npm run typecheck 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "FOUND THE PROBLEM: TypeScript compilation errors" -ForegroundColor Red
    Write-Host "First few errors:" -ForegroundColor Yellow
    $tsResult | Select-String "error TS" | Select-Object -First 10
    exit
}
Write-Host "OK: TypeScript passed" -ForegroundColor Green

# Check 2: ESLint
Write-Host "`n[CHECK 2] ESLint..." -ForegroundColor Yellow
$lintResult = & npx eslint . --max-warnings=0 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "FOUND THE PROBLEM: ESLint errors or warnings present" -ForegroundColor Red
    $warningCount = ($lintResult | Select-String "warning").Count
    Write-Host "Warning count: $warningCount (CI requires: 0)" -ForegroundColor Yellow
    if ($warningCount -gt 0) {
        Write-Host "CI WILL FAIL! All warnings must be fixed." -ForegroundColor Red
        Write-Host "Run: npm run lint to see all warnings" -ForegroundColor Cyan
    }
    exit
}
Write-Host "OK: ESLint passed" -ForegroundColor Green

# Check 3: Test imports
Write-Host "`n[CHECK 3] Test file imports..." -ForegroundColor Yellow
if (!(Test-Path "src/test/setup.ts")) {
    Write-Host "FOUND THE PROBLEM: src/test/setup.ts missing!" -ForegroundColor Red
    exit
}
if (!(Test-Path "src/test/utils/deterministic.ts")) {
    Write-Host "FOUND THE PROBLEM: src/test/utils/deterministic.ts missing!" -ForegroundColor Red
    exit
}
Write-Host "OK: Test files exist" -ForegroundColor Green

# Check 4: Dependencies
Write-Host "`n[CHECK 4] Dependencies..." -ForegroundColor Yellow
if (!(Test-Path "node_modules/vitest")) {
    Write-Host "FOUND THE PROBLEM: vitest not installed!" -ForegroundColor Red
    Write-Host "Run: npm install" -ForegroundColor Yellow
    exit
}
Write-Host "OK: Dependencies installed" -ForegroundColor Green

Write-Host "`n=== All basic checks passed ===" -ForegroundColor Green
Write-Host "CI failure might be platform-specific or in test execution" -ForegroundColor Cyan
