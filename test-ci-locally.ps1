# Test CI Locally - Simulates GitHub Actions workflow
# Run this to diagnose what's failing in CI

Write-Host "=== CI Diagnostic Test ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/5] Checking Node version..." -ForegroundColor Yellow
node --version
npm --version
Write-Host ""

Write-Host "[2/5] Running type check..." -ForegroundColor Yellow
npm run typecheck
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Type check failed!" -ForegroundColor Red
    Write-Host "This is likely why CI is failing" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Type check passed" -ForegroundColor Green
Write-Host ""

Write-Host "[3/5] Running ESLint..." -ForegroundColor Yellow
npx eslint . --max-warnings=440 --format=stylish
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ ESLint failed!" -ForegroundColor Red
    Write-Host "This is likely why CI is failing" -ForegroundColor Red
    exit 1
}
Write-Host "✓ ESLint passed" -ForegroundColor Green
Write-Host ""

Write-Host "[4/5] Running tests..." -ForegroundColor Yellow
npm run test:ci
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Tests failed!" -ForegroundColor Red
    Write-Host "This is likely why CI is failing" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Tests passed" -ForegroundColor Green
Write-Host ""

Write-Host "[5/5] Running benchmarks..." -ForegroundColor Yellow
npm run bench:ci
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Benchmarks failed!" -ForegroundColor Red
    Write-Host "This is likely why CI is failing" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Benchmarks passed" -ForegroundColor Green
Write-Host ""

Write-Host "=== All CI checks passed! ===" -ForegroundColor Green
Write-Host "If CI is still failing, the issue is environment-specific (Ubuntu vs Windows)" -ForegroundColor Cyan
