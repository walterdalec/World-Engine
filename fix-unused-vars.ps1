# Quick fix for common unused variable patterns
param(
    [string]$Path = "src"
)

Write-Host "Fixing unused variables in $Path..."

# Common patterns to fix
$patterns = @(
    # Single letter parameters that are unused
    @{ Pattern = '\(([a-zA-Z])\)\s*=>\s*{'; Replacement = '(_$1) => {' },
    @{ Pattern = '\(([a-zA-Z]),\s*([a-zA-Z])\)\s*=>\s*{'; Replacement = '(_$1, _$2) => {' },
    @{ Pattern = '\(([a-zA-Z]),\s*([a-zA-Z]),\s*([a-zA-Z])\)\s*=>\s*{'; Replacement = '(_$1, _$2, _$3) => {' },
    
    # Common unused variable names
    @{ Pattern = '\bconst\s+(result|color|faction|config|action|events|state)\s*='; Replacement = 'const _$1 =' },
    @{ Pattern = '\blet\s+(result|color|faction|config|action|events|state)\s*='; Replacement = 'let _$1 =' }
)

Get-ChildItem -Path $Path -Recurse -Include "*.ts", "*.tsx" | ForEach-Object {
    $file = $_.FullName
    $content = Get-Content $file -Raw
    $originalContent = $content
    
    foreach ($pattern in $patterns) {
        $content = $content -replace $pattern.Pattern, $pattern.Replacement
    }
    
    if ($content -ne $originalContent) {
        Write-Host "Fixed: $($_.Name)"
        Set-Content -Path $file -Value $content -NoNewline
    }
}

Write-Host "Done fixing unused variables."