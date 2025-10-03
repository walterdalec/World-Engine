# Update import paths script
# This script will help fix import paths in moved components

# 1. Fix character components
(Get-Content "src\features\characters\CharacterCreate.tsx") -replace "from '\.\./defaultWorlds'", "from '../../core/config'" | Set-Content "src\features\characters\CharacterCreate.tsx"
(Get-Content "src\features\characters\CharacterCreate.tsx") -replace "from '\.\./visuals'", "from '../portraits'" | Set-Content "src\features\characters\CharacterCreate.tsx"
(Get-Content "src\features\characters\CharacterCreate.tsx") -replace "from '\.\./portraitConfig'", "from '../../core/config'" | Set-Content "src\features\characters\CharacterCreate.tsx"

(Get-Content "src\features\characters\CharacterLibrary.tsx") -replace "from '\.\./defaultWorlds'", "from '../../core/config'" | Set-Content "src\features\characters\CharacterLibrary.tsx"
(Get-Content "src\features\characters\CharacterLibrary.tsx") -replace "from '\.\./visuals'", "from '../portraits'" | Set-Content "src\features\characters\CharacterLibrary.tsx"
(Get-Content "src\features\characters\CharacterLibrary.tsx") -replace "from '\.\./portraitConfig'", "from '../../core/config'" | Set-Content "src\features\characters\CharacterLibrary.tsx"

(Get-Content "src\features\characters\NameGenerator.tsx") -replace "from '\.\./seededGenerators'", "from '../../core/utils'" | Set-Content "src\features\characters\NameGenerator.tsx"

Write-Host "Character component imports updated"