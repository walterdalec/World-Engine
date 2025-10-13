#!/usr/bin/env node

/**
 * Workspace cleanup utility.
 *
 * Removes build artefacts and cached data that inflate the repository size.
 * Safe to run any time; missing targets are ignored.
 */

const { rmSync, existsSync } = require('fs');
const { resolve } = require('path');

const targets = [
  'build',
  'coverage',
  'bench_out',
  'dist',
  'packages',
  '.tsbuildinfo'
];

const root = resolve(__dirname, '..');
const deleted = [];

for (const target of targets) {
  const absolutePath = resolve(root, target);
  if (existsSync(absolutePath)) {
    rmSync(absolutePath, { recursive: true, force: true });
    deleted.push(target);
  }
}

if (deleted.length > 0) {
  console.log(`🧹 Removed: ${deleted.join(', ')}`);
} else {
  console.log('🧹 Nothing to clean. Workspace is already compact.');
}
