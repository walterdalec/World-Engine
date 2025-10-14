# Fix portrait paths to be environment-aware
$file = "src\portraitConfig.ts"
$content = Get-Content $file -Raw

# Add the helper function after the first comment block
$helperFunction = @"
/**
 * Get the base path for assets based on environment
 * - Localhost: /assets/
 * - GitHub Pages: /World-Engine/assets/
 */
const getAssetBasePath = (): string => {
    if (typeof window !== 'undefined' && window.location.hostname.includes('github.io')) {
        return '/World-Engine/assets/';
    }
    return '/assets/';
};

const ASSET_BASE = getAssetBasePath();

"@

# Insert helper after first docstring
$content = $content -replace '(\*/\s+)(export interface PortraitConfig)', "`$1$helperFunction`$2"

# Replace imagePath values - use backticks for template literals
$content = $content -replace "imagePath: '/World-Engine/assets/([^']+)'", 'imagePath: `${ASSET_BASE}$1`'

# Save
$content | Set-Content $file -NoNewline

Write-Host "✅ Fixed portrait paths in $file"
