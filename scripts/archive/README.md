# Archived PowerShell Scripts

This directory contains old utility scripts that were used during early development but are no longer needed for regular workflow.

## Archived Scripts

### Import Fixers (Obsolete)
- **fix-all-imports.ps1** - Old bulk import fixer
- **fix-engine-imports.ps1** - Old engine import fixer
- **fix-imports.ps1** - Old import path fixer

These were used to fix import paths during refactoring. No longer needed after modular architecture established.

### File Organization (Obsolete)
- **organize-files.ps1** - Old file organizer script

Used during initial codebase organization. Replaced by proper feature-based architecture in `src/features/`.

### Emergency Fixes (Obsolete)
- **hotfix.ps1** - Old hotfix automation script

Used for quick fixes during early development. Replaced by proper git workflow and CI/CD.

## Active Scripts (In `/scripts`)

Use these instead:
- **`postbuild.js`** - Post-build processing
- **`run-react-scripts.js`** - React Scripts wrapper
- Other active build scripts

## Why Archived?

These scripts were archived during the October 2025 codebase streamlining:
- Modular architecture makes manual import fixing unnecessary
- Proper git workflow eliminates need for hotfix scripts
- Feature-based organization is now standard

Kept for historical reference only.
