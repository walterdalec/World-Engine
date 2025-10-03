# Fix engine imports in UI components

$uiFiles = @(
    "src\features\ui\GameModals.tsx",
    "src\features\ui\GameMenu.tsx", 
    "src\features\ui\GameHUD.tsx",
    "src\features\ui\DevPanel.tsx"
)

foreach ($file in $uiFiles) {
    if (Test-Path $file) {
        Write-Host "Fixing imports in $file"
        (Get-Content $file) -replace "from '\.\./engine/index'", "from '../../core/engine'" | Set-Content $file
    }
}

Write-Host "Engine import fixes completed!"