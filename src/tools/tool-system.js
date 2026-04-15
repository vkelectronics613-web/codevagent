import fs from 'fs/promises';
import path from 'path';
import { exec, spawn } from 'child_process';
import { validatePath, validateCommand } from '../utils/security.js';
import open from 'open';

export class ToolSystem {
  constructor(workspace) {
    this.workspace = workspace;
    this.root = workspace.root;
    this.previewServer = null;
  }

  async execute(toolName, params) {
    switch (toolName) {
      case 'read_file':
        return await this.readFile(params.path);
      case 'write_file':
        return await this.writeFile(params.path, params.content);
      case 'list_files':
        return await this.listFiles(params.path || '.');
      case 'create_folder':
        return await this.createFolder(params.path);
      case 'delete_file':
        return await this.deleteFile(params.path);
      case 'run_command':
        return await this.runCommand(params.command);
      case 'preview':
        return await this.previewSite(params.path);
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }

  async readFile(filePath) {
    const safe = validatePath(filePath, this.root);
    return await fs.readFile(safe, 'utf-8');
  }

  async writeFile(filePath, content) {
    const safe = validatePath(filePath, this.root);
    await fs.mkdir(path.dirname(safe), { recursive: true });
    await fs.writeFile(safe, content, 'utf-8');
    return `Written: ${filePath}`;
  }

  async listFiles(dirPath) {
    const safe = validatePath(dirPath, this.root);
    const entries = await fs.readdir(safe, { withFileTypes: true });
    return entries.map(e => ({
      name: e.name,
      type: e.isDirectory() ? 'dir' : 'file',
    }));
  }

  async createFolder(dirPath) {
    const safe = validatePath(dirPath, this.root);
    await fs.mkdir(safe, { recursive: true });
    return `Created: ${dirPath}`;
  }

  async deleteFile(filePath) {
    const safe = validatePath(filePath, this.root);
    await fs.rm(safe, { recursive: true });
    return `Deleted: ${filePath}`;
  }

  async runCommand(command) {
    validateCommand(command);

    const isDevServer = command.includes('dev') || command.includes('start') || command.includes('serve') || command.includes('runserver');
    
    if (isDevServer) {
      return new Promise((resolve, reject) => {
        const child = spawn(command, [], {
          cwd: this.root,
          shell: true,
          detached: true,
          stdio: 'ignore'
        });
        
        child.unref();
        
        setTimeout(() => {
          resolve(`Server started: ${command}`);
        }, 2000);
      });
    }

    return new Promise((resolve, reject) => {
      const child = exec(command, {
        cwd: this.root,
        timeout: 120000,
        maxBuffer: 1024 * 1024,
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        stdout += data;
        process.stdout.write(data);
      });

      child.stderr?.on('data', (data) => {
        stderr += data;
        process.stderr.write(data);
      });

      child.on('close', (code) => {
        if (code === 0) resolve(stdout);
        else reject(new Error(`Command failed (exit ${code}): ${stderr || stdout}`));
      });

      child.on('error', reject);
    });
  }

  async previewSite(filePath) {
    if (this.previewServer) {
      try { this.previewServer.kill(); } catch {}
      this.previewServer = null;
    }

    const htmlPath = filePath 
      ? path.join(this.root, filePath) 
      : path.join(this.root, 'index.html');

    const packageJsonPath = path.join(this.root, 'package.json');
    let devCommand = null;
    let startUrl = 'http://localhost:3000';

    try {
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
      if (packageJson.scripts?.dev) {
        devCommand = packageJson.scripts.dev;
      } else if (packageJson.scripts?.start) {
        devCommand = packageJson.scripts.start;
      }
    } catch {}

    if (devCommand) {
      const isNext = devCommand.includes('next');
      const isReact = devCommand.includes('react') || devCommand.includes('vite');
      const isVue = devCommand.includes('vue');

      if (isNext) startUrl = 'http://localhost:3000';
      else if (isReact || isVue) startUrl = 'http://localhost:5173';
      else startUrl = 'http://localhost:3000';

      return { 
        success: true, 
        action: 'serve',
        command: devCommand, 
        url: startUrl,
        message: `Run '${devCommand}' to start the dev server`
      };
    }

    const exists = await fs.access(htmlPath).then(() => true).catch(() => false);
    if (!exists) {
      return { error: 'No index.html or dev script found. Add package.json with dev script.' };
    }

    const ext = path.extname(htmlPath).toLowerCase();
    const isHtml = ext === '.html' || ext === '.htm';

    if (!isHtml) {
      return { error: 'Preview only supports HTML files' };
    }

    const { Server } = await import('http-server');

    return new Promise((resolve) => {
      const server = new Server({
        root: path.dirname(htmlPath),
        port: 3000,
        cors: true,
        cache: -1,
      });

      server.listen(3000, () => {
        this.previewServer = server;
        
        open('http://localhost:3000');
        resolve({ success: true, url: 'http://localhost:3000' });
      });
    });
  }
}
