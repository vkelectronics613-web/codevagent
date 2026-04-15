import inquirer from 'inquirer';
import path from 'path';
import { Planner } from '../ai/planner.js';
import { Executor } from '../ai/executor.js';
import { Specialist } from '../ai/specialist.js';
import { ToolSystem } from '../tools/tool-system.js';
import { text } from '../ui/theme.js';

export class AgentLoop {
  constructor(workspace, config, ui, byte) {
this.workspace = workspace;
    this.config = config;
    this.ui = ui;
    this.byte = byte;

    const cerebrasKey = config.get('cerebrasApiKey');

    this.planner = cerebrasKey ? new Planner(cerebrasKey) : null;
    this.executor = cerebrasKey ? new Executor(cerebrasKey) : null;
    this.specialist = null;

    this.tools = new ToolSystem(workspace);
    this.conversationHistory = [];
  }

  async start() {
    if (!this.planner || !this.executor) {
      await this.byte.show('error', 'Missing API key!');
      this.ui.printError('Cerebras API key required. Get free key at cloud.cerebras.ai and add cerebrasApiKey to config.json');
      return;
    }

    const ctx = await this.workspace.getContext();
    this.ui.showSessionPanel({
      root: ctx.root,
      type: ctx.type,
      planner: 'cerebras / llama-3.1-8b',
      specialist: 'offline',
    });
    this.ui.printInputHint();

    while (true) {
      const { input } = await inquirer.prompt([{
        type: 'input',
        name: 'input',
        message: this.ui.getPrompt(),
        prefix: '',
      }]);

      const trimmed = input.trim();
      if (!trimmed) {
        continue;
      }

      if (trimmed.toLowerCase() === 'exit') {
        await this.byte.show('success', 'Session closed. Keep shipping.');
        break;
      }

      if (trimmed.toLowerCase() === 'status') {
        await this.showStatus();
        continue;
      }

      await this.handleUserInput(trimmed);
    }
  }

  async handleUserInput(input) {
    this.conversationHistory.push({ role: 'user', content: input });

try {
      await this.byte.show('thinking', 'Planning the next move...');
      const context = await this.workspace.getContext();
      
      let plan;
      try {
        plan = await this.planner.createPlan(input, context, this.conversationHistory);
      } catch (planErr) {
        const errMsg = planErr.message || '';
        if (errMsg.includes('Cannot read image') || errMsg.includes('vision') || errMsg.includes('image input') || errMsg.includes('vision model')) {
          await this.byte.show('error', 'Vision not supported.');
          this.ui.printError('This AI model only works with text/code, not images.');
          return;
        }
        if (errMsg.includes('Cerebras API error')) {
          await this.byte.show('error', 'API Error');
          this.ui.printError(errMsg);
          return;
        }
        if (errMsg.includes('Invalid JSON')) {
          await this.byte.show('error', 'AI returned invalid response.');
          this.ui.printError('Try again with a simpler request.');
          return;
        }
        throw planErr;
      }

      this.ui.printPlan(plan);

      const hasSteps = plan.steps && plan.steps.length > 0;

      if (plan.action === 'clear' || plan.summary === 'clear') {
        console.clear();
        return;
      }
      if (plan.action === 'exit' || plan.summary.toLowerCase().includes('goodbye')) {
        await this.byte.show('success', 'Goodbye! Happy coding!');
        return;
      }
      if (plan.action === 'status') {
        this.ui.showStatusCard(context);
        return;
      }
      if (plan.action === 'idea') {
        console.log();
        console.log(text(plan.summary || ''));
        console.log();
        console.log(text(plan.steps[0]?.description || ''));
        console.log();
        return;
      }

      if (plan.action === 'github') {
        await this.handleGithub();
        return;
      }

      const hasActionableSteps = hasSteps && plan.steps.some(s => 
        ['create_file', 'edit_file', 'run_command', 'create_folder', 'delete_file', 'preview'].includes(s.action)
      );

if (!hasActionableSteps) {
        console.log();
        console.log(text(plan.summary || 'Got it!'));
        console.log();
        this.conversationHistory.push({ role: 'assistant', content: plan.summary || 'Got it!' });
        return;
      }

      const planSummary = plan.summary?.toLowerCase() || '';
      const isMobile = planSummary.includes('mobile') || planSummary.includes('android') || planSummary.includes('apk') || planSummary.includes('flutter');
      const isWebsite = (planSummary.includes('website') || planSummary.includes('web')) && !isMobile;

      if (isMobile) {
        const { buildApk } = await inquirer.prompt([{
          type: 'confirm',
          name: 'buildApk',
          message: 'Build APK for Android?',
          default: true,
        }]);
        if (!buildApk) {
          await this.byte.show('thinking', 'Okay, stopped.');
          return;
        }
      }

      if (isWebsite) {
        const { runWebsite } = await inquirer.prompt([{
          type: 'confirm',
          name: 'runWebsite',
          message: 'Run this website on localhost?',
          default: true,
        }]);
        if (!runWebsite) {
          await this.byte.show('thinking', 'Okay, stopped.');
          return;
        }
      }

      if (plan.steps && plan.steps.length > 3) {
        const { proceed } = await inquirer.prompt([{
          type: 'confirm',
          name: 'proceed',
          message: 'Execute this plan?',
          default: true,
        }]);

        if (!proceed) {
          await this.byte.show('thinking', 'Okay, tell me what to change.');
          return;
        }
      }

      await this.byte.show('working', 'Executing tasks...');
      const results = [];

      for (const step of plan.steps || []) {
        this.ui.printStep(step);

        const result = await this.executor.executeStep(step, context, this.tools);
        results.push(result);

        if (result?.error) {
          if (this.specialist) {
            await this.byte.show('thinking', 'Fixing with specialist...');

            try {
              const fix = await this.specialist.fix(step, result.error, context);

              if (fix) {
                const retryResult = await this.executor.executeStep(fix, context, this.tools);
                results.push(retryResult);
              }
            } catch (error) {
              this.ui.printError(`Specialist failed: ${error.message}`);
            }
          } else {
            this.ui.printError(`Step failed: ${result.error}`);
          }
        }
      }

await this.byte.show('success', 'Done. Everything landed cleanly.');
      this.ui.printSummary(results);

      const apkResults = results.filter(r => r.action === 'ran_command' && r.output && r.output.includes('apk'));
      if (apkResults.length > 0) {
        this.ui.printSuccess('APK built! Check the build output folder.');
      }

      const githubResults = results.filter(r => r.action === 'github');
      if (githubResults.length > 0) {
        await this.handleGithub();
      }

      const devServerResults = results.filter(r => r.action === 'ran_command' && (r.command || '').includes('dev'));
      if (devServerResults.length > 0) {
        const url = 'http://localhost:3000';
        this.ui.printSuccess(`Website running at: ${url}`);
        this.ui.printSuccess(`To run again: cd ${this.workspace.root} && npm run dev`);
      }

      this.conversationHistory.push({
        role: 'assistant',
        content: `Completed: ${plan.summary}`,
      });
} catch (error) {
      await this.byte.show('error', 'Something went wrong.');
      this.ui.printError(error.message);
    }
  }

  async showStatus() {
    const ctx = await this.workspace.getContext();
    this.ui.showStatusCard(ctx);
  }

  async handleGithub() {
    const ghToken = this.config.get('githubToken') || process.env.GITHUB_TOKEN;
    let repoName = path.basename(this.workspace.root).replace(/[^a-zA-Z0-9-_]/g, '_');

    if (ghToken) {
      await this.byte.show('working', 'Publishing to GitHub...');

      try {
        try {
          await this.tools.execute('run_command', { command: 'git rev-parse --git-dir' });
        } catch {
          await this.tools.execute('run_command', { command: 'git init' });
        }

        await this.tools.execute('run_command', { command: 'git add .' });
        await this.tools.execute('run_command', { command: 'git commit -m "Initial via CodeVagent"' });

        const userRes = await fetch('https://api.github.com/user', {
          headers: { 'Authorization': `Bearer ${ghToken}` }
        });
        const user = await userRes.json();
        const username = user.login;

        const createRes = await fetch('https://api.github.com/user/repos', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${ghToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: repoName,
            private: false,
            auto_init: true
          })
        });

        if (!createRes.ok) {
          const err = await createRes.json();
          if (err.message?.includes('already exists')) {
            this.ui.printSuccess(`Repo "${repoName}" exists. Pushing...`);
          } else {
            throw new Error(err.message);
          }
        }

        try {
          await this.tools.execute('run_command', { command: 'git remote get-url origin' });
        } catch {
          await this.tools.execute('run_command', { command: `git remote add origin https://${username}:${ghToken}@github.com/${username}/${repoName}.git` });
        }
        await this.tools.execute('run_command', { command: 'git branch -M main' });
        await this.tools.execute('run_command', { command: 'git push -u origin main --force' });

        await this.byte.show('success', 'Published to GitHub!');
        this.ui.printSuccess(`https://github.com/${username}/${repoName}`);
      } catch (err) {
        await this.byte.show('error', 'Failed to publish');
        this.ui.printError(err.message);
      }
      return;
    }

    const { useGh } = await inquirer.prompt([{
      type: 'confirm',
      name: 'useGh',
      message: 'Use GitHub CLI (gh) to create repo and push?',
      default: true,
    }]);

    if (useGh) {
      await this.byte.show('working', 'Creating GitHub repository...');

      try {
        await this.tools.execute('run_command', { command: 'gh auth status' });
      } catch {
        await this.byte.show('error', 'GitHub CLI not logged in');
        this.ui.printError('Run "gh auth login" or add GitHub token to config.json');
        return;
      }

      const { confirmRepo } = await inquirer.prompt([{
        type: 'confirm',
        name: 'confirmRepo',
        message: `Create GitHub repo "${repoName}"?`,
        default: true,
      }]);

      if (!confirmRepo) {
        await this.byte.show('thinking', 'Cancelled.');
        return;
      }

      try {
        await this.tools.execute('run_command', { command: 'git init' });
        await this.tools.execute('run_command', { command: 'git add .' });
        await this.tools.execute('run_command', { command: 'git commit -m "Initial commit via CodeVagent"' });
        await this.tools.execute('run_command', { command: `gh repo create ${repoName} --public --source=. --push` });
        await this.byte.show('success', 'Published to GitHub!');
        this.ui.printSuccess(`Repo created and pushed: https://github.com/YOUR_USERNAME/${repoName}`);
      } catch (err) {
        await this.byte.show('error', 'Failed to publish');
        this.ui.printError(err.message);
      }
    } else {
      await this.byte.show('working', 'Preparing git...');

      try {
        await this.tools.execute('run_command', { command: 'git init' });
        await this.tools.execute('run_command', { command: 'git add .' });
        await this.tools.execute('run_command', { command: 'git commit -m "Initial commit via CodeVagent"' });
        await this.byte.show('success', 'Git initialized');
        this.ui.printSuccess('Add GitHub token to config.json or run "gh auth login", then use "Publish to GitHub"');
      } catch (err) {
        await this.byte.show('error', 'Git error');
        this.ui.printError(err.message);
      }
    }
  }
}

