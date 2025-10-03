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
World Engine is a React-based fantasy RPG with an integrated character creation system, tactical hex-based combat, and automated portrait generation. It features a comprehensive battle system using professional canvas rendering with Honeycomb Grid integration for smooth pan/zoom interactions.

## Architecture

### Character System
- **Character Creation**: `src/components/CharacterCreate.tsx` - Main character builder with point-buy stats, trait selection, and live portrait preview
- **Game Data**: `src/defaultWorlds.ts` - Class definitions with stat modifiers, abilities, equipment, and faction mappings
- **Species**: Human, Sylvanborn, Nightborn, Stormcaller, Crystalborn, Draketh, Alloy, Voidkin
- **Archetypes**: World-specific classes (Greenwarden, Thorn Knight, Ashblade, etc.)

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
npm start                        # Development server at localhost:3000
```

### Battle System Testing
```bash
# Navigate to battle mockup at localhost:3000/World-Engine
# Use renderer dropdown: Original | Honeycomb | Comparison
# Test drag-to-pan, wheel zoom, hex interaction
```

### Portrait System
```bash
npm run portraits:update  # Regenerate manifest.json from SVG assets
npm run portraits:test   # Test portrait generation
```

### Canvas Integration
Battle system uses professional canvas wrapper pattern:
```tsx
import HexStage from './HexStage';

<HexStage
  init={(ctx, canvas) => { /* Initialize */ }}
  onRender={(ctx, t) => { /* Render loop */ }}
  pan={(dx, dy) => { /* Handle pan */ }}
  zoom={(delta, cx, cy) => { /* Handle zoom */ }}
  onClick={(x, y) => { /* Handle click */ }}
  onHover={(x, y) => { /* Handle hover */ }}
/>
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
- Navigate to `/battle-mockup` for comprehensive battle system testing  
- Use renderer dropdown to compare Original vs Honeycomb vs Side-by-side
- Test drag-to-pan (mouse down + drag), wheel zoom, hex hover/click
- Navigate to `/portrait-test` for comprehensive portrait system testing
- Use `DevTools.testPortraitGeneration()` in console for quick tests
- Character creation has live validation and real-time portrait updates

## Critical Files
- `src/battle/components/HexStage.tsx`: Professional canvas wrapper for maps
- `src/battle/components/HoneycombRenderer.tsx`: Modern hex grid renderer
- `src/battle/types.ts`: Battle system TypeScript interfaces
- `src/visuals/types.ts`: Core interfaces for the visual system
- `src/components/CharacterCreate.tsx`: Main character builder UI
- `src/index.css`: Global CSS including map canvas styles
- `PORTRAIT_SYSTEM.md`: Detailed portrait system documentation
- `public/assets/portraits-new/catalog.json`: Asset catalog (auto-generated)

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