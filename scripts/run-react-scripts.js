const { spawn } = require('child_process');

const args = process.argv.slice(2);
const script = require.resolve('react-scripts/bin/react-scripts.js');
const env = { ...process.env };
const nodeOptions = '--max-old-space-size=2048';

env.NODE_OPTIONS = env.NODE_OPTIONS
  ? `${env.NODE_OPTIONS} ${nodeOptions}`.trim()
  : nodeOptions;

const child = spawn(process.execPath, [script, ...args], {
  env,
  stdio: 'inherit'
});

child.on('close', (code) => {
  process.exit(code ?? 0);
});