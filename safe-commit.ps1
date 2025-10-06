# Safe Git Commit Script
# Helps avoid accidentally committing AI development files

param(
    [Parameter(Mandatory=$true)]
    [string]$Message
)

Write-Host "🔍 Checking for AI development files..." -ForegroundColor Yellow

# Check for potentially problematic files
$aiFiles = @(
    "src/features/ai/*",
    "src/features/*/ai/*", 
    "src/experimental/*",
    "*.wip",
    "*.draft",
    "*.tmp"
)

$foundAiFiles = @()
foreach ($pattern in $aiFiles) {
    $files = git ls-files $pattern 2>$null
    if ($files) {
        $foundAiFiles += $files
    }
}

if ($foundAiFiles.Count -gt 0) {
    Write-Host "⚠️  WARNING: Found AI development files that might be committed:" -ForegroundColor Red
    foreach ($file in $foundAiFiles) {
        Write-Host "   - $file" -ForegroundColor Red
    }
    
    $response = Read-Host "Continue anyway? (y/N)"
    if ($response -ne "y" -and $response -ne "Y") {
        Write-Host "❌ Aborted by user" -ForegroundColor Red
        exit 1
    }
}

# Show what will be committed
Write-Host "📋 Files to be committed:" -ForegroundColor Green
git status --porcelain

$response = Read-Host "Proceed with commit? (Y/n)"
if ($response -eq "n" -or $response -eq "N") {
    Write-Host "❌ Aborted by user" -ForegroundColor Red
    exit 1
}

# Safe commit with explicit file selection
Write-Host "✅ Committing changes..." -ForegroundColor Green
git add -A
git commit -m $Message

Write-Host "🚀 Ready to push? (Y/n)" -ForegroundColor Cyan
$pushResponse = Read-Host
if ($pushResponse -ne "n" -and $pushResponse -ne "N") {
    git push origin main
    Write-Host "✨ Successfully pushed!" -ForegroundColor Green
}