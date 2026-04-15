import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import inquirer from 'inquirer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class ConfigManager {
  constructor() {
    this.configPath = path.join(process.cwd(), 'config.json');
    this.globalConfigPath = this.findGlobalConfig();
    this.config = {};
    this.runtimeKeys = {};
  }

  findGlobalConfig() {
    const possiblePaths = [
      path.join(process.env.APPDATA || '', 'npm', 'node_modules', 'codevagent', 'config.json'),
      path.join(process.env.LOCALAPPDATA || '', 'npm', 'node_modules', 'codevagent', 'config.json'),
      path.join(__dirname, '..', '..', 'config.json'),
    ];
    for (const p of possiblePaths) {
      try {
        if (fsSync.existsSync(p)) return p;
      } catch {}
    }
    return null;
  }

  async load() {
    if (this.globalConfigPath) {
      try {
        const data = await fs.readFile(this.globalConfigPath, 'utf-8');
        this.config = JSON.parse(data);
        this.configPath = this.globalConfigPath;
        return;
      } catch {}
    }

    try {
      const data = await fs.readFile(this.configPath, 'utf-8');
      this.config = JSON.parse(data);
    } catch {
      this.config = this.getDefaultConfig();
      await this.save();
    }
  }

  getDefaultConfig() {
    return {
      preferences: {
        theme: 'dark',
        autoPreview: true,
        defaultStack: 'react',
      },
    };
  }

  async promptForGithubToken() {
    const answers = await inquirer.prompt([
      {
        type: 'password',
        name: 'githubToken',
        message: 'GitHub Personal Access Token (optional, press enter to skip):',
        mask: '*',
      },
    ]);

    if (answers.githubToken?.trim()) {
      this.config.githubToken = answers.githubToken.trim();
      await this.save();
      return { available: true, token: answers.githubToken.trim(), stored: true, source: 'prompt' };
    }
    return { available: false, token: null, stored: false };
  }

  async save() {
    await fs.writeFile(
      this.configPath,
      JSON.stringify(this.config, null, 2)
    );
  }

  async promptForApiKeys() {
    const answers = await inquirer.prompt([
      {
        type: 'password',
        name: 'cerebrasApiKey',
        message: 'Cerebras API key:',
        mask: '*',
        validate: (value) => value?.trim() ? true : 'Cerebras API key is required.',
      },
    ]);

    this.runtimeKeys = {
      cerebrasApiKey: answers.cerebrasApiKey.trim(),
    };

    this.config.cerebrasApiKey = this.runtimeKeys.cerebrasApiKey;
    await this.save();

    return {
      stored: true,
      source: 'prompt',
    };
  }

  get(key) {
    return this.runtimeKeys[key] || this.config[key];
  }

  getPreference(key) {
    return this.config.preferences?.[key];
  }

  async ensureApiKeys(options = {}) {
    const cerebrasKey = process.env.CEREBRAS_API_KEY;

    if (cerebrasKey) {
      this.runtimeKeys = {
        cerebrasApiKey: cerebrasKey || null,
      };
      return {
        available: Boolean(this.runtimeKeys.cerebrasApiKey),
        source: 'env',
        stored: false,
      };
    }

    if (this.config.cerebrasApiKey) {
      this.runtimeKeys = {
        cerebrasApiKey: this.config.cerebrasApiKey || null,
      };
      return {
        available: Boolean(this.runtimeKeys.cerebrasApiKey),
        source: 'config',
        stored: false,
      };
    }

    if (options.promptIfMissing) {
      const result = await this.promptForApiKeys();
      return {
        available: Boolean(this.runtimeKeys.cerebrasApiKey),
        source: result.source,
        stored: result.stored,
      };
    }

    return {
      available: false,
      source: 'missing',
      stored: false,
    };
  }

  async ensureGithubToken(options = {}) {
    const token = process.env.GITHUB_TOKEN;

    if (token) {
      return { available: true, token, source: 'env' };
    }

    if (this.config.githubToken) {
      return { available: true, token: this.config.githubToken, source: 'config' };
    }

    if (options.promptIfMissing) {
      return await this.promptForGithubToken();
    }

    return { available: false, token: null };
  }
}