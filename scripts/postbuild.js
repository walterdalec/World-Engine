const fs = require('fs');
const path = require('path');

const source = path.resolve(__dirname, '..', 'electron.js');
const target = path.resolve(__dirname, '..', 'build', 'electron.js');

function copyElectronEntry() {
  try {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(source, target);
    console.log(`Copied ${source} -> ${target}`);
  } catch (error) {
    console.error('Failed to copy electron entry script after build.', error);
    process.exitCode = 1;
  }
}

copyElectronEntry();