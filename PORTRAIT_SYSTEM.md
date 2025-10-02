# World Engine Portrait System# World Engine Portrait System



## Overview## Overview

World Engine uses a streamlined PNG-based portrait system with open source CC0 assets and intelligent fallbacks for fantasy character visualization.The World Engine uses a simple PNG-based portrait system with open source CC0 assets and intelligent fallbacks.



## Current System (Simple PNG)## Current System (Simple PNG)



### 🎨 Architecture### 🎨 Architecture

- **Primary**: PNG asset layering (base + race + class)- **Primary**: PNG asset layering (base + race + class)

- **Assets**: DENZI CC0 spritesheets + generated placeholders- **Assets**: DENZI CC0 spritesheets + generated placeholders

- **Fallbacks**: Individual portraits → spritesheets → procedural generation- **Fallbacks**: Individual portraits → spritesheets → procedural generation

- **Integration**: Direct React components with canvas-based sprite extraction- **Integration**: Direct React components with canvas-based sprite extraction



### 📁 Asset Structure### 📁 Asset Structure

``````

public/assets/portraits-new/public/assets/portraits-new/

├── denzi-tileset.png        # 32x32 fantasy characters (CC0)├── denzi-tileset.png        # 32x32 fantasy characters (CC0)

├── denzi-monsters.png       # 32x48 character sprites (CC0)├── denzi-monsters.png       # 32x48 character sprites (CC0)

├── base/                    # Gender-specific base bodies├── base/                    # Gender-specific base bodies

├── race/                    # Species overlay PNGs  ├── race/                    # Species overlay PNGs  

├── class/                   # Archetype-specific equipment├── class/                   # Archetype-specific equipment

├── catalog.json             # Asset metadata and licensing├── catalog.json             # Asset metadata and licensing

├── sprite-mappings.json     # Coordinate mappings for extraction├── sprite-mappings.json     # Coordinate mappings for extraction

└── CREDITS.md              # Legal attribution└── CREDITS.md              # Legal attribution

``````



### 🔧 Technical Components### 🔧 Technical Components

- **SimplePortraitPreview.tsx**: Main React portrait component- **SimplePortraitPreview.tsx**: Main React portrait component

- **simple-portraits.ts**: Core PNG layering and canvas composition- **simple-portraits.ts**: Core PNG layering and canvas composition

- **spritesheet-helper.ts**: Sprite extraction utilities- **spritesheet-helper.ts**: Sprite extraction utilities

- **Environment Detection**: Automatic URL handling for localhost vs GitHub Pages- **Environment Detection**: Automatic URL handling for localhost vs GitHub Pages



### 📜 Legal & Licensing### 📜 Legal & Licensing

- **DENZI Assets**: CC0 Public Domain (no attribution required)- **DENZI Assets**: CC0 Public Domain (no attribution required)

- **Generated Assets**: MIT License (World Engine Project)- **Generated Assets**: MIT License (World Engine Project)

- **Usage**: Free for any purpose including commercial- **Usage**: Free for any purpose including commercial

- **Attribution**: Optional but appreciated- **Attribution**: Optional but appreciated



## Usage## Usage



### Basic Portrait Display### Basic Portrait Display

```tsx```tsx

import { SimplePortraitPreview } from '../visuals';import { SimplePortraitPreview } from '../visuals';



<SimplePortraitPreview <SimplePortraitPreview 

  gender="female"   gender="female" 

  species="human"   species="human" 

  archetype="greenwarden"   archetype="greenwarden" 

  size="large"   size="large" 

  showDebug={true}   showDebug={true} 

/>/>

``````



### Character Data Conversion### Character Data Conversion

```tsx```tsx

import { SimpleUtils } from '../visuals';import { SimpleUtils } from '../visuals';



const portraitOptions = SimpleUtils.convertToSimpleOptions(character);const portraitOptions = SimpleUtils.convertToSimpleOptions(character);

``````



## Debugging## Debugging

- Click the `🐞` button on any portrait for generation details- Click the `🐞` button on any portrait for generation details

- Console logs use emoji prefixes: `🎭` (portraits), `🔍` (assets), `✅` (success)- Console logs use emoji prefixes: `🎭` (portraits), `🔍` (assets), `✅` (success)

- Visual errors show in-component with specific error messages- Visual errors show in-component with specific error messages



## Development Tools## Legacy System

The original SVG portrait system has been moved to archive status but remains available in version control history for reference or future advanced features.

### Portrait Scripts

- `scripts/download-portraits.js`: Downloads CC0 assets from OpenGameArt---

- `scripts/setup-real-portraits.js`: Creates working portrait system

- `scripts/extract-portraits.js`: Extracts individual sprites from sheets*For development details, see `.github/copilot-instructions.md`*



### Installation & Setup### 📁 Asset Structure

```bash```

# Download CC0 assetspublic/assets/portraits/

node scripts/download-portraits.js├── base/                    # Species base bodies (7 species)

├── face/

# Setup portrait system│   ├── eyes/               # Eye styles (4 variants)

node scripts/setup-real-portraits.js│   ├── brows/              # Eyebrow shapes (3 variants)  

│   └── mouth/              # Mouth expressions (4 variants)

# Build and deploy├── hair/                   # Hair styles (7 variants)

npm run build├── facial_hair/            # Facial hair (3 variants)

git add -A && git commit -m "Updated portraits" && git push├── clothing/

```│   ├── verdance/           # Verdance world clothing (4 classes)

│   ├── ashenreach/         # Ashenreach world clothing (4 classes)

## Cleanup History│   └── skyvault/           # Skyvault world clothing (4 classes)

The original complex SVG portrait system has been removed to streamline the codebase:├── accessories/            # Accessories (5 variants)

- **Removed**: `src/visuals/legacy-svg-system/` (12 files, ~50KB)├── weapons/                # Weapons (12 class-specific)

- **Removed**: `public/assets/portraits/` (168 presets, multiple directories)├── effects/                # Visual effects (7 variants)

- **Removed**: Legacy portrait scripts and documentation├── manifest.json           # Asset catalog (auto-generated)

- **Result**: ~90% reduction in portrait system complexity└── presets.json           # Portrait presets (auto-generated)

```

---

## 🤖 Automated Management

*For development details, see `.github/copilot-instructions.md`*
### Update Assets
```bash
node scripts/updatePortraits.js
```
This script:
- Scans all SVG files in the portraits directory
- Updates `manifest.json` with new assets
- Generates 504 presets (7 species × 12 classes × 6 pronouns)
- Creates pronoun-aware styling combinations

### Pronoun Styling
The system includes 6 pronoun categories with distinct visual styles:

| Pronouns | Hair | Brows | Mouth | Facial Hair |
|----------|------|--------|-------|-------------|
| she/her | long_wavy | brows_arced | mouth_smile | none |
| he/him | short_straight | brows_thick | mouth_grim | stubble |
| they/them | undercut | brows_thin | mouth_neutral | none |
| xe/xir | topknot | brows_arced | mouth_neutral | none |
| ze/hir | shaved | brows_thick | mouth_smile | mustache |
| fae/faer | curly | brows_arced | mouth_smile | none |

## 🔧 Usage

### In TypeScript/React
```typescript
import { loadPortraitFromPreset, getPresetsByFilter } from './visuals/manifest';

// Load by preset ID
const svg = await loadPortraitFromPreset('human_verdance_greenwarden_she-her');

// Filter presets
const presets = await getPresetsByFilter({
    species: 'Human',
    world: 'Verdance', 
    pronouns: 'they/them'
});
```

### Character Data Integration
```typescript
const characterData: CharacterVisualData = {
    name: "Aria",
    species: "Human", 
    archetype: "Greenwarden",
    level: 5,
    pronouns: "she/her", // Enables pronoun-aware portraits
    appearance: { /* ... */ }
};
```

## 🎭 Preset System

### Preset Structure
```json
{
  "id": "human_verdance_greenwarden_she-her",
  "label": "Human • Greenwarden (Verdance) — she/her", 
  "tags": ["Human", "Verdance", "Greenwarden", "she/her"],
  "species": "Human",
  "world": "Verdance", 
  "archetype": "Greenwarden",
  "pronouns": "she/her",
  "layers": [
    "base/human.svg",
    "face/eyes/eyes_glow.svg",
    "face/brows/brows_arced.svg", 
    "face/mouth/mouth_smile.svg",
    "hair/long_wavy.svg",
    "clothing/verdance/greenwarden.svg"
  ]
}
```

### Coverage
- **504 Total Presets**
- **7 Species**: Human, Sylvanborn, Alloy, Draketh, Voidkin, Crystalborn, Stormcaller  
- **12 Classes**: 4 per world (Verdance, Ashenreach, Skyvault)
- **6 Pronouns**: Complete inclusive representation
- **Professional Art**: SVG assets with gradients, filters, and World Engine theming

## 🚀 Development

### Adding New Assets
1. Drop SVG files into appropriate directories
2. Run `node scripts/updatePortraits.js`
3. System automatically:
   - Updates manifest.json
   - Regenerates presets.json
   - Maps assets to species/classes
   - Creates new preset combinations

### Testing
```bash
# Test the portrait system
node scripts/testPortraits.js

# Check specific preset
curl http://localhost:3001/test-preset/human_verdance_greenwarden_she-her
```

## 📦 File Generation

The system generates two key files:

### manifest.json
- Asset catalog with metadata
- Species/archetype mappings  
- Auto-updated when assets change

### presets.json  
- Complete preset definitions
- 504 pronoun-aware combinations
- Ready-to-use layer configurations

This system provides a complete, automated portrait solution with inclusive pronoun representation and professional visual quality.