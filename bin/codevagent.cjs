#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

function findPath() {
  const locations = [
    process.env.APPDATA ? path.join(process.env.APPDATA, 'npm', 'node_modules', 'codevagent') : null,
    process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'npm', 'node_modules', 'codevagent') : null,
  ].filter(Boolean);

  for (const loc of locations) {
    const ip = path.join(loc, 'src', 'index.js');
    try {
      if (fs.existsSync(ip)) return ip;
    } catch {}
  }
  return null;
}

const indexPath = findPath();

if (!indexPath) {
  console.error('CodeVagent not found. Run: npm install -g codevagent');
  process.exit(1);
}

const child = spawn('node', [indexPath, ...process.argv.slice(2)], {
  stdio: 'inherit',
  cwd: process.cwd(),
  env: process.env
});

child.on('exit', (code) => process.exit(code || 0));