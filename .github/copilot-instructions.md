# World Engine AI Coding Instructions

## Development Authority
AI agents have full permissions to edit, create, modify, and refactor any code in this repository. Feel free to make direct changes to improve functionality, fix bugs, optimize performance, or implement new features without asking for permission.

## Project Overview
World Engine is a React-based character creation system with an advanced SVG portrait generation system. It manages fantasy characters across three worlds (Verdance, Ashenreach, Skyvault) with species-specific archetypes and automated visual generation.

## Architecture

### Character System
- **Character Creation**: `src/components/CharacterCreate.tsx` - Main character builder with point-buy stats, trait selection, and live portrait preview
- **Game Data**: `src/defaultWorlds.ts` - Class definitions with stat modifiers, abilities, equipment, and faction mappings
- **Species**: Human, Sylvanborn, Nightborn, Stormcaller, Crystalborn, Draketh, Alloy, Voidkin
- **Archetypes**: World-specific classes (Greenwarden, Thorn Knight, Ashblade, etc.)

### Portrait System (`src/visuals/`)
Three-tier portrait generation with automatic fallbacks:
1. **Preset System** (Primary): 504 pronoun-aware presets from `public/assets/portraits/presets.json`
2. **External Manifest** (Fallback): Asset catalog from `public/assets/portraits/manifest.json`
3. **Procedural SVG** (Last resort): Generated shapes with species/archetype colors

Key files:
- `service.ts`: Core portrait generation with caching and fallback logic
- `PortraitPreview.tsx`: React component with debug overlay (`🐞` button)
- `assets.ts`: Asset management with species/archetype fallback chains
- `renderer2d.tsx`: SVG generation and layered asset composition

## Development Workflows

### Build & Preview
```bash
npm run build                    # Production build
npm run preview                  # Static server at :5000
npm run preview:ps -- -Port 6000 # PowerShell helper with custom port
```

### Portrait System
```bash
npm run portraits:update  # Regenerate manifest.json from SVG assets
npm run portraits:test   # Test portrait generation
```

### Character Integration
Characters automatically get portraits via:
```tsx
import { PortraitPreview, bindPortraitToCharacter } from '../visuals';

// Live preview
<PortraitPreview character={VisualUtils.createCharacterData(char)} size="large" />

// Save with portrait
await bindPortraitToCharacter(character, { size: { width: 300, height: 380 } });
```

## Key Patterns

### Visual System Integration
- All character data flows through `CharacterVisualData` interface
- Portrait generation uses `species + archetype + pronouns` for asset selection
- Fallback chains: specific → generic → Human → procedural SVG
- Debug mode: Click `🐞` button on any portrait for generation details

### Asset Structure
```
public/assets/portraits/
├── base/           # Species base bodies
├── face/eyes/      # Facial features
├── hair/           # Hair styles  
├── clothing/       # World-specific clothing
├── weapons/        # Class weapons
├── effects/        # Visual effects
├── manifest.json   # Auto-generated asset catalog
└── presets.json    # Auto-generated portrait combinations
```

### Error Handling
- Portrait failures fallback gracefully through the three-tier system
- Visual errors show in-component with specific error messages
- Console logs use emoji prefixes: `🎭` (portraits), `🔍` (assets), `✅` (success)

### Performance
- Portrait caching with `JSON.stringify` keys
- Batch preloading for common species/archetype combinations  
- SVG optimization removes comments, whitespace, and redundant attributes

## Testing
- Navigate to `/portrait-test` for comprehensive portrait system testing
- Use `DevTools.testPortraitGeneration()` in console for quick tests
- Character creation has live validation and real-time portrait updates

## Critical Files
- `src/visuals/types.ts`: Core interfaces for the visual system
- `src/components/CharacterCreate.tsx`: Main character builder UI
- `PORTRAIT_SYSTEM.md`: Detailed portrait system documentation
- `public/assets/portraits/manifest.json`: Asset catalog (auto-generated)