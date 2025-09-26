param(
  [int]$Port = 5500,
  [switch]$SkipBuild
)

Write-Host "[preview] Using port $Port" -ForegroundColor Cyan

if (-not $SkipBuild) {
  Write-Host "[preview] Building app (npm run build) ..." -ForegroundColor Cyan
  npm run build
  if ($LASTEXITCODE -ne 0) {
    Write-Error "Build failed with exit code $LASTEXITCODE"
    exit $LASTEXITCODE
  }
}

try {
  $conn = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($conn -and $conn.OwningProcess) {
    Write-Host "[preview] Port $Port is in use by PID $($conn.OwningProcess). Attempting to stop it..." -ForegroundColor Yellow
    try { Stop-Process -Id $conn.OwningProcess -Force -ErrorAction Stop; Start-Sleep -Milliseconds 300 } catch { Write-Warning "Could not stop PID $($conn.OwningProcess): $_" }
  }
} catch { Write-Warning "Could not inspect port $Port: $_" }

Write-Host "[preview] Starting static server: http://localhost:$Port" -ForegroundColor Green
Write-Host "[preview] Press Ctrl+C to stop." -ForegroundColor DarkGray

# Run the server in the current window so logs are visible
npx --yes serve -s build -l $Port
