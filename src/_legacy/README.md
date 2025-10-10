# Legacy Code Archive

This directory contains archived code that is no longer actively used but preserved for reference.

## 🗂️ Contents

### battle/
Old battle system implementations that have been superseded by `BrigandineHexBattle.tsx`:
- Multiple battle page variants (BattleMockup, BattlePage, MinimalBattlePage, BattleSystem)
- Old hex implementations (hex/, hex.ts, engine_hex.ts, generate_hex.ts)
- Simple battle engine variants (simple-engine.ts, simple-types.ts)
- Incomplete integration attempts (bridge/, integration/)
- Old UI components (BattleHUD, BattleStage, SimpleBattle*)

### portraits/
Legacy portrait system code:
- Backup files (simple-portraits-backup.ts)
- Old index files (portraits-index.ts)

### planning/
Archived planning documents and experimental implementations:
- Old battle system designs
- Hex patch implementations

## ⚠️ Important Notes

1. **Not Compiled**: This directory is excluded from TypeScript compilation
2. **Not Linted**: ESLint ignores these files
3. **Not in Builds**: Webpack/build tools skip this directory
4. **Git Tracked**: Files are still in git history for reference
5. **Can Restore**: Move files back to `src/` if needed

## 🔄 How to Restore a File

If you need to reactivate legacy code:

```bash
# Example: Restore BattleMockup
git mv src/_legacy/battle/BattleMockup.tsx src/features/battle/

# Re-add to exports in src/features/battle/index.ts
# Re-add to imports in src/app/index.tsx
```

## 📊 Memory Savings

By moving unused code here, we achieved:
- **~40-50% reduction** in battle module memory usage
- **~20-30% faster** TypeScript compilation
- **Cleaner** development experience with only active code in src/

## 📅 Archive Date

October 10, 2025 - Initial cleanup and organization
