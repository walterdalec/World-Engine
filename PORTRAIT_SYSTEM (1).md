# World Engine Portrait System

## Overview
The World Engine uses a layered SVG portrait system with pronoun-aware styling and automated asset management.

## Architecture

### 🎨 Three-Tier Portrait Generation
1. **Preset System** (Primary) - Pronoun-aware presets with 504 combinations
2. **External Manifest** (Fallback) - Professional asset catalog
3. **Internal Manifest** (Backup) - Hard-coded TypeScript definitions

### 📁 Asset Structure
```
public/assets/portraits/
├── base/                    # Species base bodies (7 species)
├── face/
│   ├── eyes/               # Eye styles (4 variants)
│   ├── brows/              # Eyebrow shapes (3 variants)  
│   └── mouth/              # Mouth expressions (4 variants)
├── hair/                   # Hair styles (7 variants)
├── facial_hair/            # Facial hair (3 variants)
├── clothing/
│   ├── verdance/           # Verdance world clothing (4 classes)
│   ├── ashenreach/         # Ashenreach world clothing (4 classes)
│   └── skyvault/           # Skyvault world clothing (4 classes)
├── accessories/            # Accessories (5 variants)
├── weapons/                # Weapons (12 class-specific)
├── effects/                # Visual effects (7 variants)
├── manifest.json           # Asset catalog (auto-generated)
└── presets.json           # Portrait presets (auto-generated)
```

## 🤖 Automated Management

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