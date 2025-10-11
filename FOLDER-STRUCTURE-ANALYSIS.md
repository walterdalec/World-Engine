# Folder Structure Analysis: Two PCs Comparison

## 🔍 Problem Discovery
User reports: "game folders are completely different between this PC and my [brother's PC]"

## 📂 Current PC Structure (This PC - October 10, 2025)

### `src/` Top-Level Directories (Tracked by Git)
```
src/
├── __tests__/          # Test files
├── _legacy/            # Old code preserved for reference
├── animations/         # Animation system
├── app/                # Main React app entry point
├── battle/             # ⚠️ Canvas 14 - Tactical Battle System
├── core/               # Core game engine utilities
├── econ/               # ⚠️ Canvas 12 - Economy System
├── encounters/         # ⚠️ Canvas 13 - Encounter System
├── engine/             # ⚠️ Game Engine Core (from brother's PC work)
├── factions/           # Faction AI system
├── features/           # ✅ Modular feature architecture
│   ├── ai/
│   ├── battle/         # ✅ Brigandine-style phase battle
│   ├── characters/
│   ├── portraits/
│   ├── spells/
│   ├── strategy/       # ⚠️ Integrated Campaign System
│   ├── ui/
│   └── world/
├── modules/            # ⚠️ Modular game systems
├── packs/              # ⚠️ Content Pack System (from brother's PC)
├── pages/              # React page components
├── party/              # ⚠️ Canvas 10 - Party Framework
├── proc/               # Procedural generation utilities
├── progression/        # ⚠️ Canvas 11 - Progression System
├── state/              # ⚠️ Campaign State Management (from brother's PC)
├── store/              # Zustand store
├── test/               # Test utilities
├── ui/                 # UI components
├── validation/         # Validation utilities
└── world/              # ⚠️ World Generation Module (from brother's PC)
```

## 🎯 Key Findings

### 1. **Two Parallel Battle Systems** ⚠️
**Canvas 14 System** (`src/battle/`):
- Created: ~2 months ago (Canvas 14 commits)
- Files: api.ts, combat.ts, gen.ts, hex.ts, morale.ts, movement.ts, orders.ts, resolve.ts, rng.ts, state.ts
- Style: Professional, comprehensive tactical battle system
- Integration: Canvas 13 (encounters) → Canvas 14 (battle) → back to overworld
- Commits: `186c689`, `039c97d`, `cf52ff6`, `312d48b`, `eedb0b4`

**Brigandine Phase System** (`src/features/battle/`):
- Created: Today (October 10, 2025)
- Files: phaseEngine.ts, PixiHexBattleDemo.tsx, HexStage.tsx
- Style: Simple phase-based combat (Player → Enemy turns)
- Integration: Standalone demo with React components
- Commits: Recent work from today's session

**WHY TWO SYSTEMS?**
- Canvas 14 was built ~2 months ago as part of systematic "Canvas" architecture
- Brigandine system was built today without awareness of Canvas 14
- They solve the same problem with different approaches

### 2. **Canvas System Architecture** 🏗️
The "Canvas" system is a comprehensive game architecture built over multiple sessions:

**Canvas 10** - Party Framework (`src/party/`)
- Party member management, recruitment, dismissal
- Character stats, equipment, relationships

**Canvas 11** - Progression System (`src/progression/`)
- XP gain, leveling, skill progression
- Injury/scar system, revival mechanics

**Canvas 12** - Economy System (`src/econ/`)
- Inventory, markets, pricing, trade routes
- Upkeep costs, wages, encumbrance
- Crafting, reagents, repair

**Canvas 13** - Encounter System (`src/encounters/`)
- Context building, payload generation
- Deterministic encounter generation
- Battle result application back to overworld

**Canvas 14** - Battle System (`src/battle/`)
- Hex-based tactical combat
- Simultaneous order resolution
- Morale, status effects, terrain

### 3. **Brother's PC Work Session** 💻
According to `BROTHER-PC-WORK-SUMMARY.md`, a massive session added:

**Game Engine Core** (`src/engine/`):
- Engine.ts - Main orchestrator
- EventBus.ts - Inter-module communication
- Registry.ts - Module lifecycle
- Time.ts - Fixed-timestep loop (30 FPS)
- types.ts - Engine interfaces

**Content Pack System** (`src/packs/`):
- schemas.ts - Zod validation schemas
- loader.ts - Pack loading and validation
- index.ts - Public API

**State Management** (`src/state/`):
- types.ts - Campaign state schema
- snapshot.ts - Serialization
- restore.ts - Save file loading
- index.ts - Public API

**World Generation** (`src/world/`):
- generator.ts - 21×21 procedural world
- rng.ts - Seeded RNG
- types.ts - World types

**Integrated Campaign** (`src/features/strategy/`):
- IntegratedCampaign.tsx - 556 lines of campaign gameplay
- Full integration of all systems

### 4. **What's Different Between PCs?** 🔄

**This PC Has:**
- ✅ All Canvas systems (10, 11, 12, 13, 14) - tracked in Git
- ✅ Brother's PC work (engine/, packs/, state/, world/) - tracked in Git
- ✅ Today's Brigandine phase battle work - just committed
- ✅ Features/ modular architecture - tracked in Git

**Brother's PC Likely Has:**
- ✅ Same Git history (if pulled from origin)
- ❓ Possibly uncommitted local changes
- ❓ Possibly different node_modules versions
- ❓ Possibly different build artifacts

## 🔍 Verification Commands

To check what's actually different:

```powershell
# Check if brother's PC has unpushed commits
git log origin/feature/integrated-campaign-system..feature/integrated-campaign-system

# Check for uncommitted changes
git status

# Check for stashed work
git stash list

# Check file count differences
git ls-files | Measure-Object -Line
```

## 🎯 Root Cause Analysis

### Hypothesis 1: **Git Sync Issue** (MOST LIKELY)
**Scenario**: Brother's PC has unpushed commits or uncommitted work
**Evidence**: BROTHER-PC-WORK-SUMMARY.md describes extensive work, but some might not be committed
**Solution**: On brother's PC, run:
```powershell
git status                    # Check for uncommitted changes
git log --branches --not --remotes  # Check for unpushed commits
git push origin feature/integrated-campaign-system
```

### Hypothesis 2: **Build Artifacts** (LIKELY)
**Scenario**: Different `node_modules/` or `build/` folders
**Evidence**: These are not tracked by Git (.gitignore)
**Solution**: 
```powershell
# On this PC:
npm ci                        # Clean install from package-lock.json
npm run build                 # Rebuild

# On brother's PC - same commands
```

### Hypothesis 3: **Branch Divergence** (POSSIBLE)
**Scenario**: Working on different branches accidentally
**Evidence**: Would show different commit history
**Solution**:
```powershell
# Check current branch
git branch -a

# Check if branches have diverged
git log --oneline --graph --all --decorate
```

### Hypothesis 4: **Local .gitignore Differences** (UNLIKELY)
**Scenario**: Different .gitignore files causing different tracking
**Evidence**: .gitignore is tracked by Git, should be same
**Solution**:
```powershell
git diff origin/main -- .gitignore
```

## 📋 Action Plan for User

### Step 1: Verify Git Status (This PC)
```powershell
cd C:\Users\tdean\World-Engine
git status
git log --oneline -10
git remote -v
```

### Step 2: Check for Unpushed Work (Brother's PC)
On brother's PC, run:
```powershell
cd [brother's World-Engine path]
git status                              # Check for uncommitted files
git log --branches --not --remotes      # Check for unpushed commits
git stash list                          # Check for stashed work
```

### Step 3: Compare File Lists
On both PCs:
```powershell
# List all tracked files
git ls-files | Sort-Object > tracked-files.txt

# List all src/ directories
Get-ChildItem src/ -Directory -Name | Sort-Object > src-dirs.txt

# Compare on this PC using brother's outputs
```

### Step 4: Sync If Needed
If brother's PC has unpushed work:
```powershell
# On brother's PC:
git add .
git commit -m "Sync unpushed work from brother's PC"
git push origin feature/integrated-campaign-system

# On this PC:
git pull origin feature/integrated-campaign-system
```

### Step 5: Clean Install
On both PCs (to ensure identical dependencies):
```powershell
# Delete old modules
Remove-Item node_modules -Recurse -Force
Remove-Item package-lock.json -Force

# Fresh install
npm install

# Verify same versions
npm list --depth=0
```

## 🚨 Red Flags to Check

1. **Different package.json**: Would cause different dependencies
   ```powershell
   git diff origin/main -- package.json
   ```

2. **Different branch**: Would explain major differences
   ```powershell
   git branch -vv
   ```

3. **Uncommitted features**: Would show in `git status`
   ```powershell
   git status --porcelain
   ```

4. **Stashed work**: Would hide differences
   ```powershell
   git stash list
   git stash show -p stash@{0}
   ```

## 💡 Recommendation

**Most likely scenario**: Brother's PC has uncommitted work from the massive development session described in BROTHER-PC-WORK-SUMMARY.md.

**Immediate action**: 
1. On brother's PC, run `git status` to see what's uncommitted
2. Commit and push any changes: `git add . && git commit -m "Sync from brother's PC" && git push`
3. On this PC, pull changes: `git pull origin feature/integrated-campaign-system`

**Long-term solution**:
- Commit work frequently (at least daily)
- Push to GitHub after each work session
- Pull before starting work on any PC
- Use `git status` before switching machines

## 📊 Current Git Status

**Branch**: `feature/integrated-campaign-system`
**Remote**: Synced with origin
**Last Commit**: `31ed1c4` - "🐛 DEBUG: Add console logging to diagnose hex click cancellation issue"
**Total Commits (October)**: 606 commits

**Canvas Systems Present**:
- ✅ Canvas 10 - Party Framework
- ✅ Canvas 11 - Progression System
- ✅ Canvas 12 - Economy System
- ✅ Canvas 13 - Encounter System
- ✅ Canvas 14 - Battle System

**Brother's PC Systems Present**:
- ✅ Game Engine Core (src/engine/)
- ✅ Content Pack System (src/packs/)
- ✅ State Management (src/state/)
- ✅ World Generation (src/world/)
- ✅ Integrated Campaign (src/features/strategy/)

## 🎬 Next Steps

1. **Verify**: Run the verification commands above on both PCs
2. **Document**: Create a comparison file listing all differences found
3. **Sync**: Push/pull to ensure both PCs have identical Git state
4. **Clean**: Run `npm ci` on both PCs for identical dependencies
5. **Test**: Run `npm start` on both PCs to verify identical behavior

---

**Created**: October 10, 2025  
**Purpose**: Diagnose folder structure differences between two development PCs  
**Status**: Analysis complete, awaiting user verification on brother's PC
