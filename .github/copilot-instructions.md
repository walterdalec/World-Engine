# World Engine AI Coding Instructions

## Development Authority
AI agents have full permissions to edit, create, modify, and refactor any code in this repository. Feel free to make direct changes to improve functionality, fix bugs, optimize performance, or implement new features without asking for permission.

## Required Workflow
**ALWAYS push changes to GitHub after making code modifications.** Use this sequence:
1. Make code changes
2. `git add -A`
3. `git commit -m "descriptive message"`
4. `git push origin main`

Never leave changes uncommitted. The user relies on GitHub Pages deployment for testing.

## Assistant Role
Act as a proactive development assistant:
- **Research open source solutions** that could enhance our project without compromising originality
- **Suggest libraries, tools, or patterns** that solve common problems we encounter
- **Identify optimization opportunities** in existing code
- **Recommend best practices** for React, TypeScript, and game development
- **Look for community solutions** to complex problems before building from scratch
- Always respect licensing and ensure compatibility with our MIT-style project

## Project Overview
World Engine is a React-based character creation system with a simple PNG portrait generation system. It manages fantasy characters across three worlds (Verdance, Ashenreach, Skyvault) with species-specific archetypes and automated visual generation.

## Architecture

### Character System
- **Character Creation**: `src/components/CharacterCreate.tsx` - Main character builder with point-buy stats, trait selection, and live portrait preview
- **Game Data**: `src/defaultWorlds.ts` - Class definitions with stat modifiers, abilities, equipment, and faction mappings
- **Species**: Human, Sylvanborn, Nightborn, Stormcaller, Crystalborn, Draketh, Alloy, Voidkin
- **Archetypes**: World-specific classes (Greenwarden, Thorn Knight, Ashblade, etc.)

### Portrait System (`src/visuals/`)
**Current Active System**: Simple PNG layered portrait generation
- **SimplePortraitPreview.tsx**: React component with debug overlay (`🐞` button)
- **simple-portraits.ts**: Core PNG layering and canvas composition
- **index.ts**: Clean exports and utility functions

**Legacy System**: Complex SVG system preserved in `src/visuals/legacy-svg-system/`
- Fully functional but isolated from main game
- Available for future advanced features
- Self-contained with own imports and documentation

Key features:
- PNG asset layering (base + race + class)
- Environment-aware asset URL handling (localhost vs GitHub Pages)
- Comprehensive debugging with emoji-prefixed console logs
- Caching system for performance

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
import { SimplePortraitPreview, SimpleUtils } from '../visuals';

// Live preview
<SimplePortraitPreview 
  gender="female" 
  species="human" 
  archetype="greenwarden" 
  size="large" 
  showDebug={true} 
/>

// Convert character data
const options = SimpleUtils.convertToSimpleOptions(character);
```

## Key Patterns

### Visual System Integration
- All character data flows through `CharacterVisualData` interface
- Portrait generation uses `species + archetype + pronouns` for asset selection
- Fallback chains: specific → generic → Human → procedural SVG
- Debug mode: Click `🐞` button on any portrait for generation details

### Asset Structure
```
public/assets/portraits-new/
├── base/           # Gender-specific base bodies (male/female)
├── race/           # Species overlay PNGs
├── class/          # Archetype-specific clothing/equipment
└── catalog.json    # Asset metadata
```

Legacy SVG assets preserved in `public/assets/portraits/` for future use.

### Error Handling
- Portrait failures fallback gracefully through the three-tier system
- Visual errors show in-component with specific error messages
- Console logs use emoji prefixes: `🎭` (portraits), `🔍` (assets), `✅` (success)

### Performance
- Portrait caching with `JSON.stringify` keys
- Batch preloading for common species/archetype combinations  
- PNG optimization and canvas-based composition

## Testing
- Navigate to `/portrait-test` for comprehensive portrait system testing
- Use `DevTools.testPortraitGeneration()` in console for quick tests
- Character creation has live validation and real-time portrait updates

## Critical Files
- `src/visuals/types.ts`: Core interfaces for the visual system
- `src/components/CharacterCreate.tsx`: Main character builder UI
- `PORTRAIT_SYSTEM.md`: Detailed portrait system documentation
- `public/assets/portraits-new/catalog.json`: Asset catalog (auto-generated)