# Comprehensive import path fixes
Write-Host "Fixing import paths across all features..."

# Fix battle components
$battleFiles = @(
    "src\features\battle\BattleMockup.tsx",
    "src\features\battle\MinimalBattlePage.tsx",
    "src\features\battle\HealingSystem.tsx"
)

foreach ($file in $battleFiles) {
    if (Test-Path $file) {
        (Get-Content $file) -replace "from '\.\./battle/", "from './" | Set-Content $file
        (Get-Content $file) -replace "from '\.\./\.\./battle/", "from './" | Set-Content $file
        Write-Host "Fixed imports in $file"
    }
}

# Fix world components
$worldFiles = @(
    "src\features\world\EnhancedWorldMap.tsx",
    "src\features\world\SimpleWorldMap.tsx",
    "src\features\world\WorldMapEngine.tsx",
    "src\features\world\ExplorationMode.tsx"
)

foreach ($file in $worldFiles) {
    if (Test-Path $file) {
        (Get-Content $file) -replace "from '\.\./defaultWorlds'", "from '../../core/config'" | Set-Content $file
        (Get-Content $file) -replace "from '\.\./seededGenerators'", "from '../../core/utils'" | Set-Content $file
        (Get-Content $file) -replace "from '\.\./engine\.d'", "from '../../engine.d'" | Set-Content $file
        (Get-Content $file) -replace "from '\.\./types'", "from '../../core/types'" | Set-Content $file
        Write-Host "Fixed imports in $file"
    }
}

# Fix spell components
$spellFiles = @(
    "src\features\spells\CustomSpellCreator.tsx",
    "src\features\spells\PremadeSpells.tsx",
    "src\features\spells\SpellAssignment.tsx"
)

foreach ($file in $spellFiles) {
    if (Test-Path $file) {
        (Get-Content $file) -replace "from '\.\./defaultWorlds'", "from '../../core/config'" | Set-Content $file
        (Get-Content $file) -replace "from '\.\./seededGenerators'", "from '../../core/utils'" | Set-Content $file
        Write-Host "Fixed imports in $file"
    }
}

# Fix UI components
$uiFiles = @(
    "src\features\ui\DevPanel.tsx",
    "src\features\ui\GameHUD.tsx",
    "src\features\ui\GameMenu.tsx",
    "src\features\ui\GameModals.tsx"
)

foreach ($file in $uiFiles) {
    if (Test-Path $file) {
        (Get-Content $file) -replace "from '\.\./defaultWorlds'", "from '../../core/config'" | Set-Content $file
        (Get-Content $file) -replace "from '\.\./battle/", "from '../battle/" | Set-Content $file
        (Get-Content $file) -replace "from '\.\./visuals'", "from '../portraits'" | Set-Content $file
        Write-Host "Fixed imports in $file"
    }
}

Write-Host "Import path fixes completed!"