# World Engine

*Character Management System - Updated September 26, 2025*

Production-ready preview and deployment options without relying on the dev server.

## Local preview (stable)

Use a static server to preview the production build on a fixed port.

```powershell
npm run build
npm run preview   # serves build/ at http://localhost:5000
```

Open http://localhost:5000 in your browser.

Notes:
- This bypasses the dev server and its port prompts.
- The app falls back to built-in presets if `/worlds.json` isn’t available for any reason.

Alternatively, use the PowerShell helper to pick a port and auto‑free it:

```powershell
npm run preview:ps                 # builds and serves at http://localhost:5500
npm run preview:ps -- -Port 6000   # builds and serves at http://localhost:6000
npm run preview:ps -- -SkipBuild   # reuse last build and just serve
```

## Dev server (hot reload)

```powershell
$env:PORT=3004; $env:BROWSER="none"; npm start
```

Open the printed URL in the terminal (e.g., http://localhost:3004).

## One-click deploy (Netlify)

This repo includes `netlify.toml` for SPA routing.

1. Push this repo to GitHub.
2. In Netlify, “Add new site” → “Import from Git”.
3. Build command: `npm run build`  •  Publish directory: `build`
4. Deploy. Your app will be hosted at a public URL.

## Deploy to Vercel

1. Install the Vercel CLI (optional) or use the Vercel dashboard.
2. “New Project” → Import this repo.
3. Framework preset: Create React App
4. Build command: `npm run build` • Output directory: `build`
5. Deploy.

This repo includes `vercel.json` with SPA fallback.

## Deploy to GitHub Pages

1. (Optional but recommended) Set the `homepage` field in `package.json` to your pages URL, e.g.:

	```json
	"homepage": "https://<user>.github.io/<repo>"
	```

2. Deploy with:

	```powershell
	npm run deploy:gh
	```

This uses `npx gh-pages` to publish the `build/` folder to the `gh-pages` branch.

## Scripts

- `npm start` — Dev server with hot reload
- `npm run build` — Production build to `build/`
- `npm run preview` — Static preview at http://localhost:5000

## Desktop Application

World Engine can be run as a native desktop app using Electron!

**Quick Start:**
```bash
npm run electron:dev     # Development mode with hot reload
npm run electron:build   # Build and run production version
```

**Build Installers:**
```bash
npm run dist:win    # Windows installer (.exe)
npm run dist:mac    # macOS disk image (.dmg)
npm run dist:linux  # Linux AppImage
```

Or use the PowerShell helper on Windows:
```powershell
.\build-desktop.ps1
```

**Important:** Windows installers require either:
- Building on a Windows machine (recommended), OR
- Wine installed on Linux/Mac

See [DESKTOP-SETUP.md](DESKTOP-SETUP.md) for complete desktop app documentation.

## Installable/Offline (PWA-lite)

- In production (build + preview or deployed), a service worker caches the app shell for offline use.
- To install as an app in Edge/Chrome: open the site → browser menu → Install app.
- When you publish a new build, the app updates on next load; you can force it by closing/reopening.

