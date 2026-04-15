import fs from 'fs/promises';
import path from 'path';
import inquirer from 'inquirer';

const BUILD_DIRS = ['build', 'dist', 'outputs', '.next', 'out'];

export class WorkspaceManager {
  constructor() {
    this.root = null;
    this.projectType = null;
  }

  async resolve(argPath) {
    let targetPath = argPath;

    if (!targetPath) {
      const { userPath } = await inquirer.prompt([{
        type: 'input',
        name: 'userPath',
        message: 'project path:',
        default: './my-app',
      }]);
      targetPath = userPath;
    }

    const abs = path.resolve(process.cwd(), targetPath);
    const basename = path.basename(abs).toLowerCase();

    if (BUILD_DIRS.includes(basename)) {
      console.log(`\nwarning: "${basename}" looks like a build/output folder.`);
      const { useParent } = await inquirer.prompt([{
        type: 'confirm',
        name: 'useParent',
        message: 'use parent directory instead?',
        default: true,
      }]);
      if (useParent) {
        return path.dirname(abs);
      }
    }

    try {
      await fs.access(abs);
    } catch {
      const { create } = await inquirer.prompt([{
        type: 'confirm',
        name: 'create',
        message: `"${abs}" does not exist. create it?`,
        default: true,
      }]);
      if (!create) {
        return null;
      }
      await fs.mkdir(abs, { recursive: true });
    }

    return abs;
  }

  async initialize(workspacePath) {
    this.root = workspacePath;

    this.projectType = await this.detectProject();
  }

  async detectProject() {
    try {
      const pkg = JSON.parse(
        await fs.readFile(path.join(this.root, 'package.json'), 'utf-8')
      );
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };

      if (deps.next) return 'nextjs';
      if (deps.react) return 'react';
      if (deps.vue) return 'vue';
      if (deps.express) return 'express';
      if (deps['@angular/core']) return 'angular';
      return 'node';
    } catch {
      try {
        await fs.access(path.join(this.root, 'requirements.txt'));
        return 'python';
      } catch {}

      try {
        await fs.access(path.join(this.root, 'Cargo.toml'));
        return 'rust';
      } catch {}

      return 'empty';
    }
  }

  async getContext() {
    const files = await this.listFiles(this.root, 3);
    return {
      root: this.root,
      type: this.projectType,
      files,
    };
  }

  async listFiles(dir, maxDepth = 3, currentDepth = 0) {
    if (currentDepth >= maxDepth) {
      return [];
    }

    const ignore = ['node_modules', '.git', '.codevagent', 'dist', 'build', '.next'];
    const imageExts = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp', '.bmp'];
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const result = [];

    for (const entry of entries) {
      if (ignore.includes(entry.name)) {
        continue;
      }

      const fullPath = path.join(dir, entry.name);
      const relPath = path.relative(this.root, fullPath);
      
      if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (imageExts.includes(ext)) {
          continue;
        }
      }

      if (entry.isDirectory()) {
        result.push({ path: relPath, type: 'dir' });
        const children = await this.listFiles(fullPath, maxDepth, currentDepth + 1);
        result.push(...children);
      } else {
        result.push({ path: relPath, type: 'file' });
      }
    }

    return result;
  }
}
