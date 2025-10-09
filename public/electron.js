// Electron entry shim for electron-builder CRA preset.
// The real main process code lives at ../electron.js.
if (require.main === module) {
  require('../electron.js');
}