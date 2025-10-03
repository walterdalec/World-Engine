# World Engine Release Management

## 🚀 Auto-Update System

World Engine now includes a sophisticated auto-update system that automatically delivers new versions to your brothers without manual downloads!

### ✅ Features Included

**Auto-Update Notifications:**
- ✅ Automatic update checking on app startup
- ✅ Background download with progress indicators  
- ✅ Non-intrusive notification system
- ✅ User choice: "Update Now" or "Update Later"

**Version Management:**
- ✅ Semantic versioning (major.minor.patch)
- ✅ Prerelease support (beta versions)
- ✅ Build info display (Electron, Node, Chrome versions)
- ✅ Platform detection and architecture info

**Release Tools:**
- ✅ Automated release script with rollback protection
- ✅ Hotfix script for emergency patches
- ✅ GitHub integration for automatic distribution

## 🛠️ Release Workflow

### 1. Regular Releases

**For feature updates and improvements:**

```powershell
# Patch release (1.0.3 → 1.0.4)
.\release.ps1 -VersionType patch -ReleaseNotes "Fixed battle system bugs and improved character portraits"

# Minor release (1.0.4 → 1.1.0) 
.\release.ps1 -VersionType minor -ReleaseNotes "Added multiplayer support and new magic schools"

# Major release (1.1.0 → 2.0.0)
.\release.ps1 -VersionType major -ReleaseNotes "Complete UI overhaul and Godot integration"
```

**What happens automatically:**
1. ✅ Version number bumped in package.json
2. ✅ React app built and optimized
3. ✅ Windows installer created with auto-update capability
4. ✅ Git tag created and pushed to GitHub
5. ✅ Release published to GitHub with installer downloads
6. ✅ Auto-update mechanism activated for existing users

### 2. Hotfixes (Emergency Patches)

**For critical bugs that need immediate fixes:**

```powershell
# Emergency hotfix
.\hotfix.ps1 -Description "Fixed critical crash when loading saved games"
```

**Hotfix process:**
1. ✅ Automatically bumps patch version
2. ✅ Creates hotfix documentation
3. ✅ Builds and tests the fix
4. ✅ Asks for confirmation before release
5. ✅ Delivers immediately to all users via auto-update

### 3. Beta Releases

**For testing new features with your brothers:**

```powershell
# Beta release (1.0.3 → 1.0.4-beta.1)
.\release.ps1 -VersionType prerelease -PrereleaseId beta -Draft
```

## 📦 Distribution Methods

### **Automatic Updates (Primary)**
- Users get notified automatically
- Download happens in background
- One-click update process
- No manual download needed

### **Manual Downloads (Backup)**
- GitHub Releases page has .exe installers
- Direct download links for sharing
- Offline installation support

### **Development Builds**
```powershell
# Test locally
npm run electron:build

# Create installer without publishing
npm run dist:win
```

## 🎯 Brother Gaming Benefits

### **For You (Developer):**
- ✅ **One-click releases** - Push updates instantly
- ✅ **Automatic distribution** - No manual file sharing
- ✅ **Version tracking** - See what everyone is running
- ✅ **Rollback protection** - Scripts prevent broken releases

### **For Your Brothers:**
- ✅ **Automatic updates** - Always have the latest version
- ✅ **No downloads** - Updates happen seamlessly
- ✅ **Version info** - Check Help → Version Info anytime
- ✅ **Stable experience** - Hotfixes deliver immediately

## 🔧 Available Commands

### **Release Scripts:**
```powershell
.\release.ps1 patch           # Bug fixes (1.0.3 → 1.0.4)
.\release.ps1 minor           # New features (1.0.4 → 1.1.0)  
.\release.ps1 major           # Breaking changes (1.1.0 → 2.0.0)
.\release.ps1 prerelease      # Beta versions (1.0.3 → 1.0.4-beta.1)
.\hotfix.ps1 "Fix description"  # Emergency patches
```

### **NPM Scripts:**
```bash
npm run electron              # Run desktop app
npm run electron:dev          # Development with hot reload
npm run dist                  # Build installer
npm run release               # Build and publish to GitHub
npm run version:patch         # Bump version only
```

### **App Menu Options:**
- **Help → Check for Updates** - Manual update check
- **Help → Version Info** - Show detailed version information

## 🔍 Version Information Display

The app shows comprehensive version details:

```
App Version: 1.0.3
Electron: 38.2.1
Node.js: 20.9.0  
Chrome: 120.0.6099.56
Platform: win32 (x64)
Build: Production
```

## 🚨 Emergency Procedures

### **If Release Fails:**
1. Scripts automatically rollback version changes
2. Git history remains clean
3. Try again after fixing the issue

### **If Update Breaks Something:**
1. Create immediate hotfix: `.\hotfix.ps1 "Rollback to stable version"`
2. Users get automatic fix delivery
3. No manual intervention needed

### **If GitHub Publishing Fails:**
1. Installers are still created in `./dist/` folder
2. Can manually share .exe files as backup
3. Re-run release script when GitHub is accessible

## 📋 Pre-Release Checklist

Before releasing to your brothers:

- [ ] **Test locally** with `npm run electron:build`
- [ ] **Verify features** work as expected
- [ ] **Check version display** shows correct info
- [ ] **Test auto-update** notifications appear
- [ ] **Run on clean machine** to verify installer works
- [ ] **Document changes** in release notes

## 🎮 Ready for Brotherhood Gaming!

Your World Engine now has enterprise-grade release management:

- ✅ **Professional auto-updates** like AAA games
- ✅ **Instant hotfix delivery** for critical issues  
- ✅ **Seamless brother distribution** - they always have latest version
- ✅ **Version transparency** - everyone knows what they're running
- ✅ **Developer confidence** - rollback protection and automated testing

Ship updates to your brothers with confidence! 🚀