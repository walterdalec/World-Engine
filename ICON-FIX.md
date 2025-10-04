# Windows Installer Icon Fix

## Problem

The Windows installer was failing with the error:
```
⨯ image /home/runner/work/World-Engine/World-Engine/public/favicon.ico must be at least 256x256
```

## Root Cause

Electron-builder requires Windows installer icons to be **at least 256x256 pixels** for proper display in:
- Windows taskbar
- Alt+Tab switcher
- Start menu
- Desktop shortcuts
- Installation wizard

The original `favicon.ico` only contained 16x16 and 24x24 pixel versions, which are too small for Windows installers.

## Solution

### 1. Created New Icon File

A new multi-resolution icon file was created at `public/icon.ico` with the following resolutions:
- 256x256 (required minimum)
- 128x128
- 64x64
- 48x48
- 32x32
- 16x16

The icon was generated from the existing `logo512.png` file using ImageMagick:

```bash
convert public/logo512.png -define icon:auto-resize=256,128,64,48,32,16 public/icon.ico
```

### 2. Updated Configuration

**package.json** - Updated electron-builder configuration:
```json
"win": {
  "target": "nsis",
  "icon": "public/icon.ico"  // Changed from favicon.ico
},
"nsis": {
  "installerIcon": "public/icon.ico",  // Changed from favicon.ico
  "uninstallerIcon": "public/icon.ico"  // Changed from favicon.ico
}
```

**electron.js** - Updated window icon:
```javascript
icon: path.join(__dirname, 'public/icon.ico')  // Changed from favicon.ico
```

### 3. Fixed Cross-Platform Build Script

The build script was also updated to work on all platforms (Windows, Mac, Linux):

**Before (Windows-only):**
```json
"build": "set NODE_OPTIONS=--max-old-space-size=2048 && react-scripts build && copy electron.js build\\electron.js"
```

**After (Cross-platform):**
```json
"build": "react-scripts build",
"postbuild": "node -e \"require('fs').copyFileSync('electron.js', 'build/electron.js')\""
```

## Building Windows Installers

### On Windows

Simply run:
```powershell
.\build-desktop.ps1
# or
npm run dist:win
```

### On Linux/Mac

Building Windows installers on Linux/Mac requires Wine:

```bash
# Install Wine first
sudo apt-get install wine  # Ubuntu/Debian
brew install wine          # macOS

# Then build
npm run dist:win
```

**Recommended**: Use GitHub Actions or a Windows machine for building Windows installers.

## Files Changed

- ✅ `public/icon.ico` - New multi-resolution icon (256x256+)
- ✅ `package.json` - Updated icon paths and build script
- ✅ `electron.js` - Updated window icon path
- ✅ `build-desktop.ps1` - Added platform warnings and error messages
- ✅ `DESKTOP-SETUP.md` - Added icon requirements documentation

## Verification

To verify the icon has correct resolutions:
```bash
file public/icon.ico
# Should show: MS Windows icon resource - 6 icons, 256x256...
```

## Note

The original `favicon.ico` is still used for the web version and has been backed up as `favicon.ico.backup` if needed.
