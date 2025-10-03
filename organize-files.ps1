# File organization script
# Moving components to feature-based structure

# World-related components
Copy-Item "src\components\EnhancedWorldMap.tsx" "src\features\world\"
Copy-Item "src\components\SimpleWorldMap.tsx" "src\features\world\"
Copy-Item "src\components\WorldMapEngine.tsx" "src\features\world\"
Copy-Item "src\components\WorldRenderer.tsx" "src\features\world\"
Copy-Item "src\components\WorldSetupScreen.tsx" "src\features\world\"
Copy-Item "src\components\ExplorationMode.tsx" "src\features\world\"

# Battle-related components
Copy-Item "src\components\BattleMockup.tsx" "src\features\battle\"
Copy-Item "src\components\BattlePage.tsx" "src\features\battle\"
Copy-Item "src\components\BattleSystem.tsx" "src\features\battle\"
Copy-Item "src\components\MinimalBattlePage.tsx" "src\features\battle\"
Copy-Item "src\components\HealingSystem.tsx" "src\features\battle\"

# Spell-related components
Copy-Item "src\components\CustomSpellCreator.tsx" "src\features\spells\"
Copy-Item "src\components\PremadeSpells.tsx" "src\features\spells\"
Copy-Item "src\components\SpellAssignment.tsx" "src\features\spells\"
Copy-Item "src\components\SpellGenerator.tsx" "src\features\spells\"

# UI components
Copy-Item "src\components\MainMenu.tsx" "src\features\ui\"
Copy-Item "src\components\GameMenu.tsx" "src\features\ui\"
Copy-Item "src\components\GameHUD.tsx" "src\features\ui\"
Copy-Item "src\components\GameModals.tsx" "src\features\ui\"
Copy-Item "src\components\ErrorBoundary.tsx" "src\features\ui\"
Copy-Item "src\components\DevPanel.tsx" "src\features\ui\"
Copy-Item "src\components\helpers.ts" "src\features\ui\"

Write-Host "File organization complete!"