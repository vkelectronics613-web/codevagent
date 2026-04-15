import figlet from 'figlet';
import {
  THEME,
  accent,
  accentStrong,
  danger,
  keyValue,
  muted,
  panel,
  success,
  text,
} from './theme.js';

const LOGO_OPTIONS = {
  font: 'Small',
  horizontalLayout: 'fitted',
};

function renderLogo() {
  return `${figlet.textSync('CODEV', LOGO_OPTIONS)}\n${figlet.textSync('AGENT', LOGO_OPTIONS)}`;
}

export class UI {
  async showStartup() {
    console.clear();
    console.log(accentStrong(renderLogo()));
    console.log();
    console.log(text('Autonomous coding workflow for local projects.'));
    console.log(muted('Plan, edit, run, and iterate from one terminal session.'));
    console.log();
  }

  print(value) {
    console.log(value);
  }

  printSuccess(message) {
    console.log(success(message));
  }

  showSessionPanel(session) {
    console.log(panel([
      accentStrong('Ready'),
      '',
      text(`Workspace: ${session.root}`),
      text(`Project: ${session.type}`),
      muted('  Type a request to begin'),
    ].join('\n'), { borderColor: THEME.success }));
  }

  printInputHint() {
    console.log();
  }

  getPrompt() {
    return accentStrong('>');
  }

  printPlan(plan) {
    console.log();
    console.log(accentStrong('Plan: ') + text(plan.summary || 'Working on your request...'));
    console.log();
    
    if (plan.steps && plan.steps.length > 0) {
      plan.steps.forEach((step, index) => {
        if (step.action === 'idea') {
          console.log();
          console.log(text(step.description || ''));
          console.log();
          return;
        }
        const action = step.action === 'create_file' ? 'CREATE' :
                      step.action === 'edit_file' ? 'EDIT' :
                      step.action === 'run_command' ? 'RUN' :
                      step.action === 'create_folder' ? 'MKDIR' :
                      step.action === 'delete_file' ? 'DELETE' :
                      step.action === 'preview' ? 'PREVIEW' : 
                      (step.action ? step.action.toUpperCase() : 'TASK');
        console.log(`  ${index + 1}. ${accent(action)} ${text(step.description || step.path || '')}`);
      });
    }
    console.log();
  }

  printStep(step) {
    const action = step.action === 'create_file' ? 'CREATE' :
                  step.action === 'edit_file' ? 'EDIT' :
                  step.action === 'run_command' ? 'RUN' :
                  step.action === 'create_folder' ? 'MKDIR' :
                  step.action === 'delete_file' ? 'DELETE' :
                  step.action === 'preview' ? 'PREVIEW' : 
                  (step.action ? step.action.toUpperCase() : 'TASK');
    console.log(`  ${accent('→')} ${accent(action)} ${text(step.description || step.path || '')}`);
  }

  printSummary(results) {
    const succeeded = results.filter((result) => result.success).length;
    const failed = results.filter((result) => !result.success).length;
    console.log();
    if (failed > 0) {
      console.log(danger(`  ✗ ${failed} failed`));
    }
    if (succeeded > 0) {
      console.log(success(`  ✓ ${succeeded} completed`));
    }
  }

  printError(message) {
    console.log();
    console.log(danger(`  Error: ${message}`));
  }

  showStatusCard(ctx) {
    console.log();
    console.log(panel([
      text(`Workspace: ${ctx.root}`),
      text(`Type: ${ctx.type}`),
      text(`Files: ${ctx.files.length}`),
    ].join('\n'), { borderColor: THEME.frame }));
  }

  async streamText(value, delay = 15) {
    for (const char of value) {
      process.stdout.write(char);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    console.log();
  }
}