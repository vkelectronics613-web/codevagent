import path from 'path';

const BLOCKED_COMMANDS = [
  'rm -rf /',
  'rm -rf ~',
  'rm -rf *',
  'mkfs',
  'dd if=',
  ':(){:|:&};:',
  'shutdown',
  'reboot',
  'format',
  'del /f /s /q',
  'rmdir /s /q C:',
];

/**
 * Validate that a file path stays within workspace boundaries
 */
export function validatePath(filePath, workspaceRoot) {
  const resolved = path.resolve(workspaceRoot, filePath);
  const normalized = path.normalize(resolved);

  if (!normalized.startsWith(path.normalize(workspaceRoot))) {
    throw new Error(`🚫 Access denied: path "${filePath}" escapes workspace boundary.`);
  }

  return normalized;
}

/**
 * Check if a command is safe to execute
 */
export function validateCommand(command) {
  const lower = command.toLowerCase().trim();

  for (const blocked of BLOCKED_COMMANDS) {
    if (lower.includes(blocked)) {
      throw new Error(`🚫 Blocked dangerous command: "${command}"`);
    }
  }

  // Block path traversal in commands
  if (lower.includes('../') && (lower.startsWith('rm') || lower.startsWith('del'))) {
    throw new Error(`🚫 Blocked suspicious command with path traversal: "${command}"`);
  }

  return true;
}
