/**
 * EXECUTOR — CodeVagent Code Generator
 * Generates complete production-ready applications
 */

import open from 'open';

const CODEGEN_PROMPT = `You are an expert full-stack developer AI. Generate COMPLETE, PRODUCTION-READY code.

REQUIREMENTS:
- Generate FULL code - not snippets or skeletons
- Include all imports, exports, types, configurations
- Use modern best practices for the specific framework
- Add real functionality: forms, API calls, routing, state management, etc.
- For React/Next.js: functional components, hooks, proper structure

OUTPUT:
- Complete file content only
- No markdown code blocks
- Full working code`;

export class Executor {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.cerebras.ai/v1';
  }

  /**
   * Execute a single plan step
   */
  async executeStep(step, context, tools) {
    try {
      switch (step.action) {
        case 'create_file':
          return await this.createFile(step, context, tools);
        case 'edit_file':
          return await this.editFile(step, context, tools);
        case 'create_folder':
          return await this.createFolder(step, tools);
        case 'run_command':
          return await this.runCommand(step, tools);
        case 'delete_file':
          return await this.deleteFile(step, tools);
        case 'preview':
          return await this.previewSite(step, tools);
        case 'serve':
          return await this.serveProject(step, tools);
        case 'github':
          return { success: true, action: 'github', message: 'GitHub publish requested' };
        default:
          return { success: false, error: `Unknown action: ${step.action}` };
      }
    } catch (err) {
      return { success: false, error: err.message, step };
    }
  }

  async createFile(step, context, tools) {
    let content = step.content;

    if (!content) {
      content = await this.generateCode(step.description, context);
    }

    await tools.execute('write_file', { path: step.path, content });
    return { success: true, action: 'created', path: step.path };
  }

  async editFile(step, context, tools) {
    const existing = await tools.execute('read_file', { path: step.path });

    const prompt = `File: ${step.path}\n\nEXISTING:\n${existing}\n\nEDIT: ${step.description}\n\nGenerate the COMPLETE updated file with all changes.`;

    const newContent = await this.generateCode(prompt, context);
    await tools.execute('write_file', { path: step.path, content: newContent });
    return { success: true, action: 'edited', path: step.path };
  }

  async createFolder(step, tools) {
    await tools.execute('create_folder', { path: step.path });
    return { success: true, action: 'created_folder', path: step.path };
  }

  async runCommand(step, tools) {
    const output = await tools.execute('run_command', { command: step.command || step.description });
    return { success: true, action: 'ran_command', command: step.command || step.description, output };
  }

  async deleteFile(step, tools) {
    await tools.execute('delete_file', { path: step.path });
    return { success: true, action: 'deleted', path: step.path };
  }

  async previewSite(step, tools) {
    const result = await tools.execute('preview', { path: step.path });
    
    if (result.command) {
      await tools.execute('run_command', { command: result.command });
      await new Promise(r => setTimeout(r, 4000));
      open(result.url);
      return { success: true, action: 'served', url: result.url, message: `Server running at ${result.url}` };
    }
    
    return result;
  }

  async serveProject(step, tools) {
    const command = step.command || step.description;
    const result = await tools.execute('run_command', { command });
    
    if (command.includes('dev') || command.includes('start') || command.includes('runserver')) {
      await new Promise(r => setTimeout(r, 3000));
      const url = command.includes('3000') ? 'http://localhost:3000' : 
                  command.includes('5173') ? 'http://localhost:5173' :
                  command.includes('8000') ? 'http://localhost:8000' : 'http://localhost:3000';
      open(url);
    }
    
    return { success: true, action: 'served', command, output: result };
  }

  /**
   * Generate code using Groq
   */
  async generateCode(prompt, context) {
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b',
        messages: [
          { role: 'system', content: CODEGEN_PROMPT },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
        max_tokens: 16000,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Cerebras API error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    let content = data.choices?.[0]?.message?.content || '';

    content = content.replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '');

    return content;
  }
}
