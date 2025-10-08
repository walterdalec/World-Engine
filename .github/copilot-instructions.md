# World Engine AI Coding Instructions

## Development Authority
AI agents have full permissions to edit, create, modify, and refactor any code in this repository. Feel free to make direct changes to improve functionality, fix bugs, optimize performance, or implement new features without asking for permission.

## 🎯 INITIAL GAME SCOPE (Priority #1)
**Current simplified design for initial release:**
- **4 Species**: human, sylvanborn, nightborn, stormcaller (complete portrait coverage)
- **6 Archetypes**: knight/ranger/chanter (male), mystic/guardian/corsair (female)
- **7-Stat System**: STR/DEX/INT/CON/WIS/CHA/LCK with 27-point budget
- **Expansion Later**: Additional species (crystalborn, draketh, alloy, voidkin) and archetypes to be added in future updates

## Critical Development Guidelines

### Character System Compatibility
**ALWAYS use the working implementations** when updating character systems:
- **Stat System**: Use 27-point budget with proper cost scaling (1/2/3 points), MIN_STAT=8, MAX_STAT=20
- **Species**: Use specialized races ('human', 'sylvanborn', 'nightborn', 'stormcaller') that match portrait assets
- **Archetypes**: Use gender-locked classes ('knight', 'ranger', 'chanter', 'mystic', 'guardian', 'corsair') 
- **Portrait Props**: Always use `.toLowerCase()` for species/archetype compatibility

### Original Lore Enforcement  
**Avoid D&D placeholders** in TODO files and implementations:
- Replace generic races (Elf, Dwarf) → Our species (Sylvanborn, Crystalborn, Draketh, etc.)
- Replace standard classes (Fighter, Wizard, Rogue) → Our archetypes (Knight, Mystic, Corsair, etc.)
- Replace D&D mechanics → Our 7-stat system (STR/DEX/INT/CON/WIS/CHA/LCK)
- Maintain World Engine's unique fantasy setting and original faction lore

## Required Workflow
**ALWAYS push changes to GitHub after making code modifications.** Use this sequence:
1. Make code changes
2. `git add -A`
3. `git commit -m "descriptive message"`
4. `git push origin main`

Never leave changes uncommitted. The user relies on GitHub Pages deployment for testing.

## Git Safety & Collaboration
**CRITICAL: Always check what files are being staged before committing** to avoid accidentally committing work-in-progress code from other developers:

### Pre-Commit Safety Checks
1. **Check status first**: `git status` to see what files are modified
2. **Review staged files**: `git diff --cached` to see exactly what will be committed
3. **Selective staging**: Use `git add <specific-files>` instead of `git add -A` when there are WIP files
4. **Exclude patterns**: Be aware of common WIP directories like:
   - `src/features/*/ai/` (AI development in progress)
   - `src/experimental/` 
   - Files with `.wip`, `.draft`, or `.tmp` extensions
   - Any files mentioned as "work in progress" by the user

### Safe Git Workflow
```bash
# Safer alternative to git add -A:
git status                    # See what's changed
git add package.json         # Add specific files
git add .github/workflows/   # Add specific directories  
git add src/components/MyComponent.tsx  # Add individual files
git commit -m "descriptive message"
git push origin main
```

### Recovery from Accidental Commits
If you accidentally commit work-in-progress files:
1. Use `git rm --cached <file>` to remove from tracking while keeping locally
2. Commit the removal with clear explanation
3. Push immediately to fix the public repository

## Assistant Role
Act as a proactive development assistant:
- **Research open source solutions** that could enhance our project without compromising originality
- **Suggest libraries, tools, or patterns** that solve common problems we encounter
- **Identify optimization opportunities** in existing code
- **Recommend best practices** for React, TypeScript, and game development
- **Look for community solutions** to complex problems before building from scratch
- Always respect licensing and ensure compatibility with our MIT-style project

## Open-Source Research & Integration (OSRI)

**Purpose:** Define exactly how AI assistants will research, vet, and integrate open-source code to accelerate builds—without risking license conflicts, security issues, or messy glue code.

### Default Policy (assumptions you can override)

* **License posture:** Prefer **permissive** licenses (**MIT, Apache-2.0, BSD, ISC**). Use **MPL-2.0/LGPL** only with clear boundaries. **Avoid GPL/AGPL** unless explicitly approved.
* **Attribution:** Always credit sources in code comments + a **CREDITS.md** and **THIRD-PARTY-LICENSES.txt**. Respect **Apache NOTICE** requirements.
* **Integration style:** Wrap external code behind clean interfaces. Pin versions. Add tests before/after integrating.
* **Security:** Prefer mature, maintained libs. Run basic auditing tools and skim for red flags.

### Research Workflow (what AI will do each time)

1. **Snapshot requirements.** 1–3 sentences: what problem, constraints, perf targets, platform.
2. **Search plan.** Use multi-site queries (GitHub/GitLab, npm/PyPI/crates.io/Go, Maven Central, Awesome lists). Query patterns:
   * `"<feature>" <language> library site:github.com stars:>50`
   * `<framework> <feature> npm`, `pypi <keyword>`, `awesome <topic>`
   * `"<protocol/standard>" reference implementation`
3. **Shortlist 3–7 candidates** with comparison table: **Name/Link, License, Stars, Last Release, Maintainers, Activity (90d), Docs, Test coverage/badges, Size, Ecosystem**, quick pros/cons.
4. **License check & compatibility.** Confirm SPDX tag and obligations (attribution, NOTICE, patents, static vs dynamic linking constraints).
5. **Quality signals.** Commits trend, issue/PR hygiene, bus factor, CI badges, API stability, versioning policy.
6. **Security pass.** Look for postinstall scripts, obfuscated blobs, risky dependencies, known CVE badges/issues. Run `npm audit` / `pip-audit` / `cargo audit` / `govulncheck` where applicable.
7. **API fit + size/perf.** Check tree-shaking, bundle impact, memory/CPU basics, extensibility.
8. **Recommendation.** Pick 1–2 with rationale and tradeoffs.
9. **Integration plan.** Steps, wrapper interface, example usage, test plan, rollback plan.
10. **Attribution artifacts.** Provide code comment blocks, CREDITS entry, and LICENSE notices.

### License Compatibility Cheatsheet

* **Permissive (MIT/Apache-2.0/BSD/ISC)** → Generally safe for proprietary/commercial. **Apache-2.0** includes patent grant; preserve **NOTICE**.
* **MPL-2.0 (file-level copyleft)** → You must publish changes to MPL-covered files; OK if kept isolated. Good compromise when needed.
* **LGPL-2.1/3 (weak copyleft)** → Dynamic linking typically OK; changes to the lib must be released. Avoid static linking unless you accept obligations.
* **GPL-v2/v3 (strong copyleft)** → Derivative works must be GPL; mixing into proprietary core is incompatible. Normally **avoid** for your projects.
* **AGPL-v3** → Extends copyleft over network use. Usually a **hard no** unless the entire server codebase is open.

> When in doubt, isolate risky code behind a **process or network boundary** (separate service) or propose a clean-room re-implementation.

### Code Attribution Template

```javascript
// Derived from: <repo URL>@<commit>
// License: <SPDX>, see /THIRD-PARTY-LICENSES.txt
// Adaptations: <brief note>
```

### Retro & Age Policy

**Your preference:** You like old-style games and are fine using older code as long as it functions.

**What changes for research & selection:**
* **No age penalty.** No downranking projects for having old release dates.
* **Function-first.** If code meets requirements and license is compatible, it's eligible—regardless of last update.
* **Stars/activity flexible.** Low stars or quiet repos are acceptable if the code is readable, testable, and passes basic security checks.

**Making older code safe in modern stack:**
1. **Compatibility check:** Confirm target runtimes (Node 20+, modern browsers) and module format (ESM/CJS), add TypeScript types if missing.
2. **Containment:** Wrap lib in adapter pattern. For heavy/legacy code, consider Web Worker or process boundary.
3. **Modernization light-touch:** Add minimal shims/polyfills only when required; avoid invasive rewrites.
4. **Security pass:** Run ecosystem audits; look for postinstall scripts, bundled binaries, or CVEs; manual skim for unsafe patterns.
5. **Fork-and-freeze:** If upstream inactive, fork repo, pin commit, keep `/patches` folder + CHANGELOG for fixes.
6. **Determinism & tests:** Add wrapper-level regression tests so behavior stays stable across updates.
7. **Bundle & perf budget:** Measure impact; default soft budget ≤50KB brotli per integrated feature.
8. **Exit plan:** Document how to swap/disable via adapter for quick replacement if needed.

**Defaults assumed unless overridden:**
* Accept any last-release date
* Accept low-star libraries if license is clear and code passes audits
* Prefer **permissive licenses** (MIT/Apache/BSD/ISC); **avoid GPL/AGPL** unless explicitly approved
* Target: Canvas 2D + WebGL1 friendly where relevant to retro aesthetic

## Project Overview
World Engine is a strategic fantasy RPG inspired by **Might and Magic 4-6** and **Brigandine**, featuring modular feature architecture, tactical hex-based combat, character creation with real-time validation, and a sophisticated portrait generation system. The game combines classic turn-based exploration with strategic kingdom management and tactical battles. Built with TypeScript, Zustand for state management, and supports web deployment (GitHub Pages/Netlify) with future desktop deployment planned.

### Core Game Vision
**Might & Magic 4-6 + Brigandine + Mount & Blade Hybrid**:
- **Exploration**: First-person party-based exploration of procedural worlds
- **Strategic Layer**: Kingdom/faction management with seasonal campaigns  
- **Dynamic Warfare**: Mount & Blade-style faction conflicts with shifting borders and emergent politics
- **Tactical Combat**: Hex-based battles with commanders and mercenary units
- **Character Progression**: Deep character customization with species, archetypes, and abilities
- **World Persistence**: Seasonal progression with persistent consequences across campaigns

## Current Architecture (v2.0+)

### Modular Feature System (`src/features/`)
**Clean separation by domain** - each feature is self-contained with types, components, and logic:

- **`features/battle/`**: Complete hex-based tactical combat system with Honeycomb Grid
- **`features/characters/`**: Character creation, validation, and management 
- **`features/portraits/`**: PNG layering portrait system with fallbacks
- **`features/ui/`**: Reusable UI components and design system
- **`features/world/`**: Procedural world generation and map systems
- **`features/spells/`**: Magic system and spell management

Each feature exports through `index.ts` with clean interfaces:
```tsx
// Import from features with clean namespacing
import { BattlePage, BattleDevTools } from '../features/battle';
import { CharacterCreate, useCurrentCharacter } from '../features/characters';
import { SimplePortraitPreview } from '../features/portraits';
```

### Core Services (`src/core/`)
**Shared infrastructure** that all features can use:
- **`core/engine/`**: Main game engine with character/party management and world state
- **`core/services/`**: Random number generation, storage utilities, campaign persistence
- **`core/types/`**: Global TypeScript interfaces for characters, factions, and world state
- **`core/utils/`**: Cross-feature utility functions for game mechanics

### Strategic Game Systems
**Kingdom/Campaign Management** (Brigandine-inspired):
- **Seasonal Progression**: Campaigns progress through seasons with timed objectives
- **Faction Dynamics**: Multiple kingdoms with shifting alliances and territorial control
- **Resource Management**: Gold, recruitment points, and magical resources
- **Commander System**: Hero characters lead armies and have persistent progression

**Dynamic Overworld Warfare** (Mount & Blade-inspired):
- **Living World**: Factions wage war independently, with AI-driven expansion and contraction
- **Emergent Politics**: Alliances form and break based on territorial pressure and opportunity
- **Border Conflicts**: Contested territories change hands through ongoing battles
- **Mercenary Opportunities**: Player can serve different factions or remain independent
- **Economic Warfare**: Trade routes, sieges, and territorial control affect faction strength

**Exploration Systems** (Might & Magic-inspired):
- **Party-Based Adventure**: Classic first-person party exploration
- **Procedural Worlds**: Hex-based overworld with dungeons, towns, and encounters
- **Quest Networks**: Interconnected storylines across multiple locations
- **Character Progression**: Traditional RPG leveling with modern skill systems

### State Management (Zustand)
**Centralized but feature-organized** state in `src/store/gameStore.ts`:
```tsx
// Multiple state hooks for different concerns
const { currentCharacter, updateCurrentCharacter } = useCharacterActions();
const { isCreatingCharacter, currentStep } = useUIState();
const { mapSettings, generateMapSeed } = useMapActions();
const { currentSeason, factionStatus } = useCampaignState(); // Strategic layer
```

### Multi-Platform Support
**Three deployment targets** with unified codebase:
- **Web (localhost:3000)**: `npm start` for development and browser play
- **Static sites**: `npm run build && npm run preview` for GitHub Pages/Netlify hosting
- **Desktop**: Future desktop deployment planned for offline campaigns

### Game Design Philosophy
**Strategic RPG Hybrid** - Combining the best of both inspirations:
- **Tactical Depth**: Every battle matters, with consequences for the strategic layer
- **Character Investment**: Deep character customization with persistent party members
- **World Agency**: Player choices shape faction relationships and world events
- **Dynamic Warfare**: Factions fight each other independently, creating emergent storylines
- **Exploration Rewards**: Discovery and exploration drive both character and strategic progression
- **Seasonal Campaigns**: Time pressure creates meaningful strategic decisions
- **Living Overworld**: Wars ebb and flow without player intervention, creating organic opportunities

## Architecture

### Character System (`src/features/characters/`)
**Professional character creation with M&M 1-2 retro aesthetic**
- **Character Creation**: `src/components/CharacterCreate.tsx` - Main character builder with point-buy stats, trait selection, and live portrait preview
- **Classic Creator**: `src/features/characters/creator/ClassicCharacterCreator.tsx` - Enhanced M&M 1-2 style 6-step wizard with merged functionality
- **Game Data**: `src/defaultWorlds.ts` - Class definitions with stat modifiers, abilities, equipment, and faction mappings
- **Species**: Human, Sylvanborn, Nightborn, Stormcaller (initial 4 with portrait assets)
- **Archetypes**: Gender-locked classes (Knight/Ranger/Chanter = male, Mystic/Guardian/Corsair = female)
- **Stat System**: 27-point budget with cost scaling (1 for 9-14, 2 for 15-16, 3 for 17+), range 8-20

**Working Portrait Integration**:
- Use initial 4 species: 'human', 'sylvanborn', 'nightborn', 'stormcaller' 
- Use gender-locked archetypes: 'knight', 'ranger', 'chanter', 'mystic', 'guardian', 'corsair'
- Always apply `.toLowerCase()` to species/archetype props for compatibility

**CRITICAL LESSON LEARNED**: Always use the working implementations. Previous attempts to "improve" the stat system made it too weak. The 27-point budget with proper cost scaling is balanced and proven.

### Battle System (`src/battle/`) ✅ IMPLEMENTED
**Professional hex-based tactical combat with modern canvas rendering**

#### Core Components
- **HexStage.tsx**: Professional canvas wrapper with pointer events, drag-to-pan, wheel zoom
- **HoneycombRenderer.tsx**: Modern hex grid renderer using Honeycomb Grid library
- **RendererComparison.tsx**: Side-by-side testing tool for renderer comparison
- **types.ts**: Battle state interfaces, hex coordinates, unit definitions
- **engine.ts**: Battle logic, turn management, combat resolution
- **factory.ts**: Battle state creation and unit generation

#### Key Features
- **Hex Coordinates**: Axial (q,r) storage with cube math for distance/LOS calculations
- **Professional Canvas**: Drag-to-pan only while mouse down, wheel zoom without page scroll
- **No-Scroll Hover**: Page stays stable during mouse hover over battle map
- **Honeycomb Grid**: Modern TypeScript hex grid library with optimized coordinate conversion
- **Phase System**: Setup → HeroTurn → UnitsTurn → EnemyTurn with proper state management
- **Camera Persistence**: Pan/zoom state maintained across interactions and re-renders

#### CSS Integration
```css
.map-root {
  overflow: hidden;
  overscroll-behavior: none;   /* Prevent scroll chaining */
}

.map-canvas {
  touch-action: none;          /* Disable browser touch gestures */
  cursor: grab;
}
```

### Portrait System (`src/features/portraits/`)
**Current Active System**: Simple PNG layered portrait generation
- **SimplePortraitPreview.tsx**: React component with debug overlay (`🐞` button)
- **simple-portraits.ts**: Core PNG layering and canvas composition
- **portraitConfig.ts**: Working portrait system with specialized races and gender-locked classes
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
- **CRITICAL**: Use specialized species ('human', 'sylvanborn', 'nightborn') and gender-locked archetypes
- **CRITICAL**: Always use `.toLowerCase()` for species/archetype compatibility

## Development Workflows

### Build & Deployment
```powershell
# Development
npm start                           # Dev server at localhost:3000
$env:PORT=3004; npm start          # Custom port with PowerShell

# Production builds  
npm run build                      # Production build to /build
npm run preview                    # Static server at localhost:5000
npm run preview:ps -- -Port 6000  # PowerShell helper with custom port

# Deployment
npm run deploy:gh                  # Deploy to GitHub Pages
npm run build && netlify deploy   # Deploy to Netlify

# Future desktop deployment
# npm run dist:win                 # Windows executable (planned)
```

### Memory Management
**For development environments with limited RAM** use optimized scripts:
```powershell
npm run start:low-mem              # Lower memory usage for dev
npm run build:low-mem              # Lower memory builds
```

### Performance & Optimization Guidelines
**Critical for large-scale strategic RPG**:
- **Lazy Loading**: Load campaign data, portraits, and maps only when needed
- **Asset Streaming**: Preload common assets, defer rare combinations
- **State Persistence**: Use Zustand's `persist` middleware for campaign saves
- **Canvas Optimization**: Batch draw calls, use `requestAnimationFrame` for smooth 60fps
- **Memory Budget**: Target ≤100MB RAM for web deployment, ≤500MB for desktop
- **Bundle Size**: Keep core features ≤2MB, defer heavy systems like 3D rendering

### Feature Development
**Each feature is independently testable**:
```powershell
# Navigate to localhost:3000 for main app
# Test specific features:
# - Character Creation: Full validation and portrait preview
# - Battle System: /battle-mockup for hex combat testing  
# - Portrait System: Debug mode with 🐞 button for generation logs
# - World Maps: Multiple renderer comparisons
```

### Data Persistence & Campaign Management
**Multi-layered save system** for strategic campaign continuity:
```tsx
// Campaign data flows through multiple backup layers
// Layer 1: Primary localStorage for active campaigns
// Layer 2: Backup localStorage with timestamps
// Layer 3: SessionStorage for crash recovery  
// Layer 4: Individual campaign backups
// Layer 5: Auto-download every 10 saves

// Access campaign state through hooks
const { currentCampaign, saveCampaign } = useCampaignActions();
const { factionStates, territoryControl } = useWorldState();
```

**Key persistence patterns**:
- **Incremental Saves**: Save changes immediately, not just on exit
- **Emergency Recovery**: SessionStorage backup for browser crashes
- **Export/Import**: JSON-based campaign sharing and backups
- **Version Migration**: Handle save file format changes gracefully

### Strategic Systems Architecture
**AI-driven faction simulation** for living world dynamics:
```tsx
// Faction AI runs independently of player actions
const factionAI = {
  economicDecisions: calculateTradeRoutes(faction, worldState),
  militaryActions: planCampaigns(faction, enemies, allies),
  diplomaticMoves: evaluateAlliances(faction, neighbors),
  territorialExpansion: identifyTargets(faction, opportunities)
};

// World events cascade through interconnected systems
faction.economy.tradeRoutes → faction.military.strength → faction.diplomacy.leverage
```

**Key strategic patterns**:
- **Seasonal Cycles**: Events trigger based on calendar progression
- **Cascading Effects**: Economic changes affect military capability
- **Player Agency**: Actions influence but don't control world dynamics
- **Emergent Narrative**: Faction conflicts create story opportunities

### Canvas Development
**Professional canvas patterns** for battle maps and world generation:
```tsx
// HexStage wrapper provides:
// - Pointer capture for smooth dragging
// - Wheel zoom without page scroll  
// - Touch gesture prevention
// - Device pixel ratio support
import { HexStage } from '../features/battle';

<HexStage
  onRender={(ctx, dt) => { /* 60fps render loop */ }}
  onPan={(dx, dy) => { /* Camera movement */ }}
  onZoom={(delta, cx, cy) => { /* Zoom with cursor centering */ }}
/>
```

## Key Patterns

### Modular Architecture
**Feature isolation with clean exports**: Each `src/features/` directory has its own `index.ts`:
```tsx
// features/battle/index.ts exports all battle-related functionality
export { BattlePage, BattleDevTools } from './components';
export type { BattleState, Unit, HexPosition } from './types';
export { startBattle, nextPhase } from './engine';
```

### State Management Patterns  
**Zustand with feature-specific hooks** in `src/store/gameStore.ts`:
```tsx
// Don't use the main store directly - use specific hooks
const { currentCharacter, updateCurrentCharacter } = useCharacterActions();
const { isCreatingCharacter, currentStep } = useUIState();
const { mapSettings, generateMapSeed } = useMapActions();
```

### Character Integration
**Consistent character data flow** through standardized interfaces:
```tsx
// All character creation flows through these patterns
import { SimplePortraitPreview, SimpleUtils } from '../features/portraits';
import { validateCharacter, createEmptyCharacter } from '../validation/character-simple';

// Convert character data for portraits
const portraitOptions = SimpleUtils.convertToSimpleOptions(character);

// Live preview with debug mode
<SimplePortraitPreview 
  {...portraitOptions}
  size="large" 
  showDebug={debugMode}  // Click 🐞 for generation logs
/>
```

### Asset Management
**Multi-tier fallback system** for portraits and assets:
```
public/assets/portraits-new/     # Primary PNG layered system
├── base/                        # Gender-specific base bodies  
├── race/                        # Species overlays
├── class/                       # Archetype clothing/equipment
└── catalog.json                 # Asset metadata (auto-generated)

Fallback chain: Specific PNG → Generic PNG → Human → Procedural SVG
```

### Environment Awareness
**Development vs Production asset loading**:
```tsx
// Assets automatically detect localhost vs GitHub Pages
// No manual URL configuration needed
const assetUrl = getAssetUrl('portraits-new/base/female.png');
// localhost:3000/assets/... vs GitHub Pages subdirectory handling
```

### Error Handling & Debugging
**Comprehensive logging with emoji prefixes**:
```tsx
console.log('🎭 Portrait generation:', options);  // Portraits
console.log('🔍 Asset loading:', url);             // Assets  
console.log('✅ Operation success:', result);      // Success
console.log('⚔️ Battle state:', battleData);      // Battle system
console.log('🎮 Game store:', stateUpdate);       // State management
console.log('🏛️ Faction AI:', factionDecision);   // Strategic layer
console.log('🗺️ World generation:', mapData);     // Procedural systems
```

### AI Development Guidelines
**When implementing game systems, prioritize**:
- **Modularity**: Each system should work independently and be testable in isolation
- **Emergent Complexity**: Simple rules that create complex behaviors (Mount & Blade inspiration)
- **Player Agency**: Systems should respond to but not revolve around player actions
- **Performance**: Target 60fps for tactical battles, smooth campaign map interactions
- **Save Compatibility**: Always consider save file migration when changing data structures
- **Testing Hooks**: Export DevTools for each major system for debugging and balancing

**System Integration Patterns**:
```tsx
// Each game system exports clean interfaces
export const FactionAI = {
  simulate: (factions, worldState, deltaTime) => newFactionStates,
  getPlayerOpportunities: (factions, playerRep) => availableContracts,
  triggerEvent: (eventType, params) => worldConsequences
};

// Systems communicate through events, not direct coupling
eventBus.emit('territory-captured', { faction, territory, consequences });
eventBus.emit('trade-route-disrupted', { route, cause, economicImpact });
```

## Testing
- **Main Menu**: Navigate to localhost:3000 for full app with navigation
- **Battle System**: Use Main Menu → Battle System for comprehensive hex combat testing  
- **Character Creation**: Use Main Menu → Character Create for live validation and portrait updates
- **Portrait System**: Use Main Menu → Portrait Test, click `🐞` for debug logs
- **World Maps**: Use Main Menu → Enhanced Map or Simple Map for world generation
- **Canvas Interaction**: Test drag-to-pan (mouse down + drag), wheel zoom, hex hover/click
- **DevTools Integration**: Use browser console with feature-specific DevTools exports

## Critical Files
- `src/features/*/index.ts`: Clean feature exports and public APIs
- `src/core/index.ts`: Shared infrastructure and cross-feature utilities
- `src/store/gameStore.ts`: Zustand state management with feature-specific hooks
- `src/app/index.tsx`: Main application routing and campaign management
- `src/features/battle/types.ts`: Battle system TypeScript interfaces
- `src/features/portraits/simple-portraits.ts`: PNG layering portrait generation
- `src/validation/character-simple.ts`: Character validation and creation utilities
- `public/assets/portraits-new/catalog.json`: Asset catalog (auto-generated)
- `package.json`: Build scripts including memory-optimized variants

## Technology Constraints & Preferences
**Browser Compatibility**: Target modern browsers (ES2020+), Chrome/Firefox/Safari latest 2 versions
**Mobile Support**: Responsive design for tablets, phone UI is secondary priority
**Offline Capability**: Core game must work offline after initial load (PWA-style)
**Asset Loading**: Lazy load heavy assets, prioritize fast initial page load
**TypeScript**: Strict mode enabled, prefer type safety over convenience
**Dependencies**: Minimize bundle size, prefer lightweight alternatives when possible

**Key Libraries in Use**:
- **State Management**: Zustand with persistence middleware
- **Canvas**: Native Canvas 2D API with Honeycomb Grid for hex math
- **UI Framework**: React 18+ with modern hooks patterns
- **Build System**: Create React App with custom memory optimizations
- **Desktop**: Future desktop deployment when the web version is complete

# Battle System Development Roadmap

## Phase 0 — Foundations & Conventions ✅ COMPLETE

* **Adopt hex coordinates**
  * Axial (q,r) for storage; convert to cube (x,y,z with x+y+z=0) for distance/LOS/aoe math.
  * Utility: `axialToCube`, `cubeDistance(a,b)`, `axialDirections[6]`, `neighborsHex(q,r)`.
* **Time & turns**
  * Phases: `Setup → HeroTurn → UnitsTurn → EnemyTurn → (repeat) → Victory/Defeat`.
  * Initiative list rebuilt each round from SPD; Hero acts only in HeroTurn.
* **Data seams** (future-proof)
  * Keep battle data pure (no rendering calls).
  * Keep visuals swappable: 2D canvas now, 3D renderer later.

## Phase 1 — Professional Canvas & Interaction ✅ COMPLETE

* **HexStage Canvas Wrapper**
  * Pointer events with `setPointerCapture` for smooth drag operations
  * Wheel zoom without page scrolling using non-passive listeners
  * Touch gesture prevention with `touch-action: none`
  * Middle-click autoscroll blocking and context menu prevention
  * Device pixel ratio support for crisp rendering on high-DPI displays
* **Honeycomb Grid Integration**
  * Modern TypeScript hex grid library with optimized coordinate conversion
  * Professional hex-to-pixel and pixel-to-hex coordinate math
  * Built-in grid bounds calculation and centering
  * Efficient hex neighbor and distance calculations
* **Camera System**
  * Persistent pan/zoom state across interactions and re-renders
  * Cursor-centered zoom with proper coordinate conversion
  * Smooth drag-to-pan only while mouse is pressed down
  * No unwanted camera resets on component re-renders
* **CSS Integration**
  * `.map-root` with `overscroll-behavior: none` to prevent scroll chaining
  * `.map-canvas` with `touch-action: none` to disable browser gestures
  * Proper cursor states: `grab` → `grabbing` during drag operations

## Phase 2 — World Map: Hex Upgrade (from squares → hexes)

## Phase 2 — World Map: Hex Upgrade (from squares → hexes)

* **Hex render & input**
  * Pointy-top or flat-top decision (recommend **pointy-top** for nicer roads).
  * Screen→hex picking, hex→screen layout (size, origin, odd/even row offset).
* **Procedural continents (resolves "tiny islands" issue)**
  * Noise stack: domain-warped FBM for elevation + tectonic mask; clamp small blobs.
  * Coastline smoothing by hex erosion; minimum landmass size threshold.
  * Moisture & temperature → biome (Grass/Forest/Desert/Swamp/Taiga/Snow).
  * **Lazy generation:** generate chunks only within N rings of player; cache seeds per chunk.
* **Road system on hexes**
  * Use A* with cost = base + slope + biome penalty; strong bias along ridges/valleys, low slope.
  * Snap to hex centers; store as list of hex coords; render as linked quads/paths.
  * Settlement↔settlement pathing precomputed; update as map expands.
* **Encounter hooks**
  * On entering an "encounter hex" spawn a battle context (biome/site, enemy group seed).

## Phase 3 — Battlefields on Hexes

## Phase 3 — Battlefields on Hexes

* **Battlefield generator (hex)**
  * Input: `{seed, biome, site, weather}`.
  * Output: `{gridHex, friendlyDeploymentHexes, enemyDeploymentHexes}`.
  * Terrain tags per hex: `movementCost`, `blocked`, `cover`, `hazard`, `elevation` (stub).
  * Special layouts: roads (settlement), corridors (dungeon), dunes (desert), swamp pools, etc.
* **Hex pathfinding & LOS**
  * A* neighbors = 6 directions.
  * LOS: hex Bresenham (or supercover) using cube coordinates; respect `blocked/elevation` (elev stub=0 now).
* **AoE shapes (hex math)**
  * **Blast r** = all hexes with `cubeDistance(center,h) ≤ r`.
  * **Cone** = fan from origin along facing dir (store 6 dirs).
  * **Line** = step along direction up to range; stop on block.

## Phase 4 — Units, Hero (Commander), Abilities

## Phase 4 — Units, Hero (Commander), Abilities

* **Unit schema (hex-ready)**
  * `pos: {q,r}`, `facing: 0..5`, `stats {hp,maxHp,atk,def,mag,res,spd,rng,move}`, `skills: string[]`, `statuses[]`.
  * `kind: "HeroCommander" | "Mercenary" | "Monster" | "Boss"`.
* **Hero (Commander) integration**
  * Off-field: `isCommander=true`, not placed on grid.
  * **HeroTurn** UI: command bar with cooldowns/charges (Rally, Meteor Strike, etc.).
  * **Aura**: passive stat bumps to allies in play (non-stacking), applied on battle start.
  * **No death for Hero** in battle; injury system is meta (campaign layer) later.
* **Mercenary loop**
  * Party units built in CharacterCreate (until taverns/merc posts are in-world).
  * On death: `isDead=true`; remove from roster or **revive cost** via shrine = f(level, gearScore).
  * Add a **post-battle Aftermath panel**: show casualties, loot, XP, revive options.
* **Ability system (data-driven)**
  * Types: `skill | spell | command`; properties for range, LOS, shape, cooldown, charges, damage/heal, statuses.
  * Commander-only flag.
  * Runtime state: cooldown timers, remaining charges.
* **Turn flow**
  * `HeroTurn`: use commander abilities anywhere in range; no unit moves.
  * `UnitsTurn`: player selects unit → move or ability → end.
  * `EnemyTurn`: simple AI (approach nearest; use best available ability).
  * Rebuild initiative each round; victory/defeat checks.

## Phase 5 — Battle UI/UX (Top-Down Now)

## Phase 5 — Battle UI/UX (Top-Down Now)

* **Hex canvas renderer**
  * Draw hex grid with biome-based palette, cover/hazard symbols, deployment highlights.
  * Unit markers: team color, HP pip, status icons, facing wedge.
  * Hover shows tile info (costs, cover), preview path, preview AoE footprint.
* **Interaction affordances**
  * Left-click: select unit / target hex.
  * Right-click: cancel, or "move here" if path valid.
  * Keybinds: `1..9` abilities, `Q/E` rotate facing, `Space` end phase.
  * Ghost preview for movement/aoe before commit; **red if illegal**.
* **Battle Setup screen (deployment)**
  * List of party units (excluding Hero), drag/select and click to place in friendly zone; overlap prevention.
* **Feedback**
  * Combat log; floating damage/heal text; screen shake on big hits (toggleable).
  * Tooltips for abilities (range, shape, cooldown, friendly fire).
  * "Your first battle" tips (inline callouts) for new players.

## Phase 6 — Onboarding & "Playable for New Players"

## Phase 6 — Onboarding & "Playable for New Players"

* **Main menu + New Game**
  * Start: create **Hero** (name, race, class, 2–3 starter abilities), seed set.
* **Guided tutorial** (10 minutes, skippable)
  * Move on hex map → reach a settlement → hire 2 mercs → first road skirmish.
  * Teach: deployment, HeroTurn commands, unit actions, retreat.
* **Starter content**
  * 3 biomes: Grass, Forest, Settlement.
  * 6 enemy types with distinct ranges & roles (melee tank, archer, caster, skirmisher, support, brute).
  * 10–12 abilities total covering melee/ranged/aoe/buff/debuff/heal.
* **Basic economy loop**
  * Gold rewards; revive pricing tied to level+gear; simple shop (potions, basic gear).
* **Saves**
  * Save after battle: hero stats, roster (alive/dead), gold, map reveal, quest flags.

## Phase 7 — Near-Future Improvements (short horizon, high impact)

## Phase 7 — Near-Future Improvements (short horizon, high impact)

* **Elevation & true LOS** (hex heights): partial cover, high-ground bonuses, fall damage on shove.
* **Status depth**: stun/root/slow/bleed/burn/poison with icons & end-of-turn ticks.
* **Commander techs**: a small tree (e.g., extra command charges, cheaper revives, better aura).
* **Morale & routing**: enemies can break and flee; Rally counters it.
* **Weather**: rain lowers ranged accuracy; snow slows move; fog reduces LOS.
* **Road ambushes**: special deployment patterns if ambushed.
* **Difficulty rails**: battle point budget scales with party power; "Story/Normal/Hard".
* **Auto-resolve** (seeded, fast) for trivial fights.
* **Controller support** (navigable hex cursor).
* **Accessibility**: colorblind palettes; text size; reduced motion toggle.

## Phase 8 — 3D-Ready Hooks (no visuals yet)

## Phase 8 — 3D-Ready Hooks (no visuals yet)

* **Renderer abstraction**: current React component uses `IBattleRenderer` interface; implement `CanvasHexRenderer` now, `ThreeHexRenderer` later.
* **Animation model**: units expose action events (`move,start_cast,hit,die`) → renderer listens; skeletal clips in 3D later.
* **Assets contract**: unit archetype → `modelId` + icon set; same IDs in 2D and 3D pipelines.

## Engineering Tasks: concrete changes

* **Types**: switch `Grid` to hex; `pos: {q:number,r:number}`; add `facing: 0..5`.
* **Math utils**: `hexNeighbors`, `hexRing`, `hexSpiral`, `lineHex`, `coneHex`, `blastHex(r)`.
* **Pathfinding**: replace 4-dir A* with 6-dir hex A*; movement costs from tile.
* **LOS**: cube-space line stepping; stop on blocking hex.
* **AoE engine**: generic shape → set of hexes function; paint previews.
* **Battle generator**: hex terrains per biome; road/corridor stamping.
* **Ability runtime**: cooldown tick at round end; charge decrement on cast; friendly-fire check.
* **Commander phase**: runtime `Commander.runtime` map; UI buttons respect cooldown/charges.
* **Aftermath**: scan `units` for deaths; run `reviveCost(level, gearScore)`; present options.
* **Saves**: serialize hex coords, statuses (turns left), commander cooldowns.
* **Dev tools**: toggle grids, LOS rays, path overlay; spawn unit; give ability; kill unit.

## Content & Assets

* **Icons** for abilities, statuses, damage types (SVG).
* **SFX**: move, hit, cast, death, UI clicks; light mix pass.
* **VFX**: simple particle decals for fireball/entangle/heal.
* **Portraits** already covered; show in unit cards.

## QA / Definition of Done

* Win/loss flows return to map without crashes; save created/loaded.
* Every ability has tooltip, range preview, and cannot target illegal hexes.
* AI always acts or waits; no stuck turns.
* Commander commands never appear for non-hero players.
* New player can: create hero → recruit 2 mercs → complete first battle → see aftermath & revive → continue.
* Hex picking accurate at all resolutions; roads render correctly along hex centers.

## Suggested "first sprint" (tight, shippable core)

1. Hex utilities + renderer + picking.
2. Battlefield generator (Grass/Forest/Settlement) + deployment.
3. Units + movement + LOS + 6–8 abilities.
4. HeroTurn command bar (Rally/Meteor Strike) + aura.
5. Minimal AI + Aftermath (revive).
6. Tutorial prompts + save/load.

# UI/UX Development Roadmap

## Phase 1 — Fast Wins (Day-one polish)

* **Consistent layout grid**
  * Adopt a 12-col responsive grid; standardize gaps (8/12/16/24px), radii (8/12), and shadows (xs/sm/md).
* **Color & theme tokens**
  * Define `--surface/--surface-2/--text/--text-muted/--accent/--danger` tokens; light/dark-compatible.
* **Button hierarchy**
  * Primary (accent), Secondary (outline), Tertiary (ghost). Disable state + loading spinners.
* **Typography scale**
  * `display, h1, h2, body, caption, mono` with consistent line-height. One font-family map.
* **Interaction states**
  * Hover/active/focus-visible rings everywhere (buttons, tabs, list items, hex cells).
* **Toasts + inline alerts**
  * Non-blocking toasts for saves/exports; inline alerts for validation errors.
* **Universal hotkeys**
  * `?` opens keymap, `Esc` cancel, `Ctrl+S` save, `G` grid toggle, `L` combat log, `T` end turn.

## Phase 2 — Navigation & Shell

* **Top-level nav**
  * App shell with persistent header (Game / Characters / Battles / Settings). Breadcrumbs on subpages.
* **Action bar pattern**
  * Sticky bottom action bar in creation/battle setup with primary action on the right (e.g., "Start Battle").
* **Panel layout**
  * Left: primary work area; Right: contextual inspector (stats, tooltips, logs). Collapsible at <1024px.

## Phase 3 — Character Creation UX

* **Two-column "Builder + Preview"**
  * Left: form wizard steps (Identity → Stats → Traits → Spells → Review). Right: live preview.
* **Point-buy meter**
  * Persistent meter with cost legend and error states (overbudget, below minimum).
* **Trait chooser chips**
  * Filterable list; badges for `Automatic / Recommended / Forbidden`. Explain why forbidden on hover.
* **Spell capacity widget**
  * Dynamic caps (cantrips/spells) with progress bars; disabled "Add" when capped (tooltip explains).
* **Save/Load UX**
  * "Save to Library" modal with thumbnail + tags; "Recent Characters" drawer.
* **Empty states**
  * Friendly guidance cards when name/species/class missing (no more void).

## Phase 4 — Hex Battle UI (Top-Down)

* **Battle HUD**
  * Top: Phase pill (`Hero Turn / Units / Enemy`), Round counter, Objective hint.
  * Left: Unit list with health bars, status icons, and initiative order (highlight active).
  * Right: **Command bar** context-aware (unit abilities or Hero commands).
* **Targeting previews**
  * Path line with move cost; AOE footprints (blast/cone/line) with valid/invalid coloring; LOS rays on demand (hold `Alt`).
* **Deployment screen**
  * Drag-to-place with snap highlighting; illegal tiles are visibly "striped." "Auto-deploy" button.
* **Combat log v2**
  * Collapsible panel with icons for damage types; filters (All/Damage/Heals/Status).
* **End-turn guardrails**
  * If actions available, confirm dialog with "Don't warn me again this battle."
* **Status tooltips**
  * Hover any icon to see effect, remaining turns, and source.

## Phase 5 — Accessibility & Input

* **Keyboard-first**
  * Tab order maps left→right; arrows move hex cursor; `Enter` confirm; `Backspace` cancel.
* **Controller ready (scaffold)**
  * Bumpers cycle targets, D-pad moves cursor, A confirm, B cancel, X ability menu.
* **Colorblind-safe palette**
  * Minimum 4.5:1 contrast; redundant shape encodings (e.g., stripes for enemy AOE).
* **Screen reader labels**
  * `aria-live` for toasts/log updates; semantic headings in panels.
* **Motion toggle**
  * Reduced motion disables screen shake and heavy particle loops.

## Phase 6 — Settings & Persistence

* **Settings modal**
  * Tabs: Gameplay (tips on/off, confirm end turn), Video (VFX density), Audio (SFX/Music sliders), Accessibility (colorblind, font size, motion).
* **Per-user prefs**
  * Save settings to `localStorage` + version key; migrate on breaking changes.
* **Keybind editor**
  * Remap and save; display conflicts.

## Phase 7 — Feedback & Onboarding

* **First-time UX beacons**
  * Pulsing markers on key UI regions with one-line explanations; dismissible.
* **Inline tutorial steps**
  * Micro-steps: "Place units → End Setup → Use Hero Command → Move → Attack." Progress at top.
* **Empty/Loading/Skeleton states**
  * Skeletons for lists/grids; spinners with specific messages ("Building battlefield…").

## Phase 8 — Performance & Robustness

* **Virtualized lists**
  * Character library, logs, and long lists use windowing (react-virtual).
* **Canvas rendering budget**
  * Batch draws; only repaint changed hexes; throttle hover previews (`requestAnimationFrame`).
* **Preload strategy**
  * Preload key sprites/icons at main menu; cache battle UI sprites on encounter reveal.

## Phase 9 — Visual Consistency

* **Icon system**
  * 24px grid, stroke-only monochrome icons; filled version for alerts/danger.
* **Damage type colors**
  * Physical, Fire, Frost, Nature, Shadow, Holy—consistent swatches + legend in log.
* **Status badge library**
  * Circular tokens with duration numerals (e.g., 🔥3, 💤1).

## UI Dev Tasks (code implementation)

* Introduce `ui/` design system (buttons, inputs, tabs, panel, toast, tooltip).
* `useKeymap()` hook with global registry and in-UI cheat sheet.
* `useCommandBar()` that swaps between Hero and Unit contexts.
* `useAnnouncements()` for combat log + toast (one source of truth).
* `HexCursor` component (keyboard/controller navigable) decoupled from mouse.
* `useSettings()` with schema + migrations; persist to localStorage.
* `TutorialCoachmarks` primitive (anchor by data-id, step definitions).

## UI QA Checklist (definition of "good UI")

* Nothing requires a mouse: full keyboard path to start/finish a battle.
* All clickable elements have visible focus rings.
* Errors explain *how to fix* ("Need 1 more cantrip slot. Raise level or INT/WIS.").
* No action is destructive without undo or confirm (delete character, end turn with actions left).
* First-time user can create a hero, recruit two mercs, and win the first fight without external help.
* 60fps during hover previews on a mid laptop (throttle cost overlays if needed).

## UI Suggested Sprint (one week, shippable UI upgrade)

1. Design tokens + button/input components + toasts.
2. Battle HUD shell (phase pill, round, objective) + command bar swap.
3. Deployment screen polish + targeting previews with better colors.
4. Keymap overlay (`?`) + standard hotkeys + focus rings everywhere.
5. Settings modal (reduced motion; colorblind palette) + persistence.