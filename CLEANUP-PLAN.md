# World Engine Codebase Cleanup Plan
**Date**: October 10, 2025  
**Goal**: Reduce memory usage, improve organization, archive legacy code

## 📊 Current Issues

1. **Memory Usage**: Too many modules loaded on localhost startup
2. **Unused Code**: Legacy battle systems, old portrait code, backup files
3. **Organization**: Multiple battle implementations, scattered utilities
4. **Build Performance**: Unnecessary files included in dev builds

## 🎯 Cleanup Strategy

### Phase 1: Create Archive Structure ✅
```
src/
  _legacy/              # Archived code (excluded from builds)
    battle/             # Old battle systems
    portraits/          # SVG portrait system
    experimental/       # WIP features
```

### Phase 2: Identify Active vs Legacy Code

#### ✅ ACTIVE (Keep in src/)
**Battle Systems:**
- `BrigandineHexBattle.tsx` - NEW primary battle system
- `morale/` - TODO #10 implementation (ready for integration)
- `abilities.ts`, `ai.ts`, `economy.ts`, `factory.ts` - Core systems
- `types.ts`, `engine.ts`, `generate.ts` - Essential infrastructure

**Portraits:**
- `simple-portraits.ts` - Active PNG layering system
- `SimplePortraitPreview.tsx`, `SimplePortraitTest.tsx` - UI components
- `index.ts` - Public API

**Characters:**
- All character creation and management

**World:**
- `procedural/` - TODO #11 (fully implemented)
- `encounters/` - Active encounter system

**Strategy:**
- `types.ts`, `world.ts`, `economy.ts`, `time.ts` - TODO #12 backend (needs UI)

#### ❌ LEGACY (Move to _legacy/)
**Battle Systems (Old/Unused):**
- `BattleMockup.tsx` - Old demo (replaced by BrigandineHexBattle)
- `BattlePage.tsx` - Broken controls, superseded
- `MinimalBattlePage.tsx` - Simplified test version
- `BattleSystem.tsx` - Old system
- `SimpleBattleHUD.tsx`, `SimpleBattleStage.tsx` - Old UI
- `simple-engine.ts`, `simple-types.ts` - Old simplified engine
- `engine_hex.ts`, `generate_hex.ts`, `hex.ts` - Old hex implementations
- `hex/` directory - Old hex utilities (redundant with BrigandineHexBattle)
- `bridge/` - Incomplete strategic bridge
- `integration/` - Old integration attempts
- `components/BattleScreen.tsx`, `BattleSetupScreen.tsx` - Old UI

**Portraits (Old/Backup):**
- `simple-portraits-backup.ts` - Backup file
- `portraits-index.ts` - Old index (redundant)

**Other:**
- `ai-complex.ts.bak` - Backup file
- `planning/world-engine-battle/` - Old planning docs
- `planning/world-engine-hex-patch2/` - Old patch work

### Phase 3: Update Imports and References

**Files to update:**
- `src/features/battle/index.ts` - Remove legacy exports
- `src/app/index.tsx` - Remove legacy battle imports
- `src/features/ui/MainMenu.tsx` - Remove legacy menu items

### Phase 4: Optimize Build Configuration

**Update `.gitignore`:**
```
# Legacy code (archived, not for production)
src/_legacy/
```

**Update `tsconfig.json`:**
```json
{
  "exclude": [
    "node_modules",
    "build",
    "dist",
    "src/_legacy"
  ]
}
```

**Update `.eslintignore`:**
```
src/_legacy/
```

## 📁 Proposed File Moves

### Battle System
```
MOVE: src/features/battle/BattleMockup.tsx 
  TO: src/_legacy/battle/BattleMockup.tsx

MOVE: src/features/battle/BattlePage.tsx
  TO: src/_legacy/battle/BattlePage.tsx

MOVE: src/features/battle/MinimalBattlePage.tsx
  TO: src/_legacy/battle/MinimalBattlePage.tsx

MOVE: src/features/battle/BattleSystem.tsx
  TO: src/_legacy/battle/BattleSystem.tsx

MOVE: src/features/battle/SimpleBattleHUD.tsx
  TO: src/_legacy/battle/SimpleBattleHUD.tsx

MOVE: src/features/battle/SimpleBattleStage.tsx
  TO: src/_legacy/battle/SimpleBattleStage.tsx

MOVE: src/features/battle/BattleHUD.tsx
  TO: src/_legacy/battle/BattleHUD.tsx

MOVE: src/features/battle/BattleStage.tsx
  TO: src/_legacy/battle/BattleStage.tsx

MOVE: src/features/battle/simple-engine.ts
  TO: src/_legacy/battle/simple-engine.ts

MOVE: src/features/battle/simple-types.ts
  TO: src/_legacy/battle/simple-types.ts

MOVE: src/features/battle/engine_hex.ts
  TO: src/_legacy/battle/engine_hex.ts

MOVE: src/features/battle/generate_hex.ts
  TO: src/_legacy/battle/generate_hex.ts

MOVE: src/features/battle/hex.ts
  TO: src/_legacy/battle/hex.ts

MOVE: src/features/battle/hex/ (entire directory)
  TO: src/_legacy/battle/hex/

MOVE: src/features/battle/bridge/ (entire directory)
  TO: src/_legacy/battle/bridge/

MOVE: src/features/battle/integration/ (entire directory)
  TO: src/_legacy/battle/integration/

MOVE: src/features/battle/components/ (BattleScreen.tsx, BattleSetupScreen.tsx)
  TO: src/_legacy/battle/components/

DELETE: src/features/battle/ai-complex.ts.bak
```

### Portraits
```
MOVE: src/features/portraits/simple-portraits-backup.ts
  TO: src/_legacy/portraits/simple-portraits-backup.ts

MOVE: src/features/portraits/portraits-index.ts
  TO: src/_legacy/portraits/portraits-index.ts
```

### Root Cleanup
```
DELETE: ai-backup-moved.ts
DELETE: fix-*.ps1 (obsolete PowerShell scripts)
DELETE: lint-*.txt (old lint outputs)
DELETE: organize-files.ps1
DELETE: quick-ci-check.ps1
DELETE: safe-commit.ps1

MOVE: planning/world-engine-battle/
  TO: _legacy/planning/world-engine-battle/

MOVE: planning/world-engine-hex-patch2/
  TO: _legacy/planning/world-engine-hex-patch2/
```

## 🎯 Expected Impact

### Memory Savings
- **Before**: ~15-20 battle implementations loaded
- **After**: 1 primary battle system + core utilities
- **Estimated Reduction**: 40-60% of battle module memory

### Build Performance
- **Before**: TypeScript compiles all legacy files
- **After**: Only active code compiled
- **Estimated Improvement**: 20-30% faster builds

### Developer Experience
- Clear separation between active and archived code
- Easier to find what's actually being used
- Can reference legacy code when needed without it running

## 📋 Execution Checklist

- [ ] Create `src/_legacy/` directory structure
- [ ] Move battle legacy files
- [ ] Move portrait legacy files
- [ ] Update `src/features/battle/index.ts` exports
- [ ] Update `src/app/index.tsx` imports
- [ ] Update `src/features/ui/MainMenu.tsx` menu items
- [ ] Update `.gitignore`
- [ ] Update `tsconfig.json`
- [ ] Update `.eslintignore`
- [ ] Clean up root directory scripts/logs
- [ ] Test localhost startup
- [ ] Verify BrigandineHexBattle still works
- [ ] Run typecheck and lint
- [ ] Document changes in CHANGELOG
- [ ] Commit with clear message

## ⚠️ Safety Notes

1. **Don't delete anything yet** - Move to `_legacy/` first
2. **Keep git history** - Use `git mv` for moves
3. **Test after each phase** - Verify nothing breaks
4. **Can restore anytime** - Just move files back if needed

## 🔄 Rollback Plan

If something breaks:
```bash
# Restore a specific file
git mv src/_legacy/battle/BattlePage.tsx src/features/battle/

# Restore entire category
git mv src/_legacy/battle/* src/features/battle/
```

---

**Ready to execute?** Let me know and I'll start with Phase 1!
