# World Engine - Desktop App Setup

## 🖥️ Desktop Application

World Engine now supports running as a native desktop application using Electron!

### 🚀 Quick Start

**Development Mode (with hot reload):**
```bash
npm run electron:dev
```
This starts the React dev server and opens Electron automatically.

**Production Mode:**
```bash
npm run electron:build
```
This builds the React app and runs Electron with the production build.

**Just run Electron (requires existing build):**
```bash
npm run electron
```

### 📦 Building Distributables

**Build installer for your platform:**
```bash
npm run dist
```

**Platform-specific builds:**
```bash
npm run dist:win    # Windows installer (.exe)
npm run dist:mac    # macOS disk image (.dmg)
npm run dist:linux  # Linux AppImage
```

**PowerShell helper (Windows):**
```powershell
.\build-desktop.ps1
```

**⚠️ Important Notes:**

- **Windows installers require Windows or Wine**: Building `.exe` installers on Linux/Mac requires Wine to be installed. It's recommended to build Windows installers on a Windows machine or use GitHub Actions.
- **Icon requirements**: Windows installers require icons to be at least 256x256 pixels. The project uses `public/icon.ico` which contains multiple resolutions (256, 128, 64, 48, 32, 16).
- **Cross-platform builds**: The build scripts use Node.js for cross-platform compatibility.

### 🔄 Auto-Update System

**Automatic Updates:**
- App checks for updates on startup and in background
- Downloads happen automatically with progress indicators
- Users get notified when updates are ready to install
- One-click update process with app restart

**Manual Update Check:**
- Help → Check for Updates (force check anytime)
- Help → Version Info (see current version and build details)

**For Developers:**
```bash
# Release new version with auto-update
.\release.ps1 patch -ReleaseNotes "Bug fixes and improvements"

# Emergency hotfix
.\hotfix.ps1 "Fixed critical save game issue"
```

### 🎮 Desktop Features

**Application Menu:**
- File → New Game, Save Game, Load Game, Exit
- Game → Character Creator, Battle System, World Map
- View → Reload, Toggle DevTools, Toggle Fullscreen
- Help → About

**Keyboard Shortcuts:**
- `Ctrl+N` - New Game
- `Ctrl+S` - Save Game  
- `Ctrl+O` - Load Game
- `Ctrl+1` - Character Creator
- `Ctrl+2` - Battle System
- `Ctrl+3` - World Map
- `Ctrl+R` - Reload
- `Ctrl+Shift+I` - Toggle DevTools
- `F11` - Toggle Fullscreen

**Window Settings:**
- Minimum size: 1200x800
- Default size: 1400x900
- Resizable and maximizable
- Desktop icon and proper window title

### 🎯 Multiplayer Ready

The desktop version is perfect for LAN gaming with your brothers:
- No browser limitations
- Better performance
- Native feel and file system access
- Easy to distribute executables

### 📁 File Structure

```
├── electron.js              # Main Electron process
├── build-desktop.ps1        # PowerShell build helper
├── package.json             # Added Electron scripts and build config
└── dist/                    # Generated installers (after npm run dist)
```

### 🔧 Development Tips

**Debugging:**
- In development, DevTools open automatically
- Use `Ctrl+Shift+I` to toggle DevTools in production
- Check the terminal for Electron process logs

**File Paths:**
- Production builds serve from `file://` protocol
- Development mode proxies to `http://localhost:3000`
- All your existing React routing and assets work unchanged

### 🎮 Ready for Your Brothers!

The desktop app gives you:
- ✅ **Proper game feel** - no browser chrome
- ✅ **Better performance** - native desktop rendering  
- ✅ **Easy distribution** - send them the `.exe` installer
- ✅ **Offline gaming** - no internet required
- ✅ **System integration** - proper taskbar, Alt+Tab, etc.

Build an installer with `npm run dist:win` and share it with your brothers to start testing multiplayer strategies!