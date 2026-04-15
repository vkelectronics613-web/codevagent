#!/usr/bin/env node

import { parseArgs } from './utils/args.js';
import { WorkspaceManager } from './core/workspace.js';
import { AgentLoop } from './core/agent-loop.js';
import { ConfigManager } from './core/config.js';
import { UI } from './ui/terminal.js';
import { Byte } from './ui/byte.js';

async function main() {
  const ui = new UI();
  const byte = new Byte();

  await ui.showStartup();
  await byte.show('thinking', 'Initializing AI agent...');

  const args = parseArgs(process.argv.slice(2));

  const config = new ConfigManager();
  await config.load();

  const workspace = new WorkspaceManager();
  const workspacePath = await workspace.resolve(args.path);

  if (!workspacePath) {
    await byte.show('error', 'Could not resolve workspace. Exiting.');
    process.exit(1);
  }

  await workspace.initialize(workspacePath);
  await byte.show('success', `Workspace ready: ${workspacePath}`);

await byte.show('running', 'Checking API keys...');
  const keyState = await config.ensureApiKeys({ promptIfMissing: true });

  if (!keyState.available) {
    await byte.show('error', 'Cerebras API key is required to continue.');
    process.exit(1);
  }

  if (keyState.stored) {
    await byte.show('success', 'API key saved to config.json');
  }

  await byte.show('running', 'Checking GitHub...');
  const ghState = await config.ensureGithubToken({ promptIfMissing: true });

  if (!ghState.available && ghState.stored) {
    await byte.show('success', 'GitHub token saved');
  } else if (ghState.available) {
    await byte.show('success', 'GitHub connected');
  }

  const agent = new AgentLoop(workspace, config, ui, byte);
  await agent.start();
}

main().catch((error) => {
  console.error('\nfatal error:', error.message);
  process.exit(1);
});
