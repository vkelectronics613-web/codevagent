export class Planner {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.cerebras.ai/v1';
  }

  async createPlan(userInput, context, history) {
    const input = userInput.toLowerCase().trim();
    const fileList = context.files.map(f => f.path).slice(0, 20).join(', ');

    const ideas = [
      { name: "Todo App", keywords: ["todo", "task", "list", "manager"], prompt: "A task management app" },
      { name: "Weather Dashboard", keywords: ["weather", "forecast"], prompt: "A weather app" },
      { name: "Chat App", keywords: ["chat", "messenger", "messaging"], prompt: "A chat application" },
      { name: "Portfolio Website", keywords: ["portfolio", "website", "personal", "profile"], prompt: "A portfolio website" }
    ];

    if (/^(hello|hi|hey)$/i.test(input) || /^(how are|what'?s up)/i.test(input)) {
      const responses = ["Hey! I'm CodeVagent, your AI coding assistant. What would you like to build?", "Hi! I'm here to help you build apps and websites.", "Hello! Tell me what you'd like to create!"];
      return { summary: responses[Math.floor(Math.random() * responses.length)], steps: [] };
    }

    if (/^(cls|clear)$/i.test(input)) {
      return { summary: "clear", steps: [{ action: "clear", description: "Clear screen" }] };
    }

    if (/^exit|quit$/i.test(input)) {
      return { summary: "Goodbye!", steps: [{ action: "exit", description: "Exit session" }] };
    }

    if (/^status$/i.test(input)) {
      return { summary: `Workspace: ${context.root}\nProject Type: ${context.type}\nFiles: ${context.files.length}`, steps: [{ action: "status", description: "Show status" }] };
    }

    if (/^(what|which|give me|suggest|ideas?|recommend|should|could)/i.test(input) && /(build|make|create|project|app|website|idea)/i.test(input)) {
      return { summary: "Here are some project ideas you can build:", steps: [{ action: "idea", description: ideas.map((idea, i) => `${i+1}. ${idea.name} - ${idea.prompt}`).join('\n') }] };
    }

    if (/(publish|push|upload|init).*github/i.test(input) || /github.*(publish|push|upload)/i.test(input)) {
      return { summary: "Publish project to GitHub", steps: [{ action: "github", description: "Initialize git and push to GitHub" }] };
    }

    if (/^[1-4]$/.test(input)) {
      const idea = ideas[parseInt(input) - 1];
      userInput = `make a ${idea.name}`;
    }

    const buildPatterns = [/make\s+a?\s*(.+)/i, /create\s+a?\s*(.+)/i, /build\s+(.+)/i, /new\s+(.+)/i];
    let projectType = null;
    for (const pattern of buildPatterns) {
      const match = input.match(pattern);
      if (match) { projectType = match[1]; break; }
    }

    if (!projectType && /todo|weather|chat|portfolio/i.test(input)) {
      if (/todo/i.test(input)) projectType = "Todo App";
      else if (/weather/i.test(input)) projectType = "Weather Dashboard";
      else if (/chat/i.test(input)) projectType = "Chat App";
      else if (/portfolio/i.test(input)) projectType = "Portfolio Website";
    }

    if (!projectType) {
      for (const idea of ideas) {
        if (idea.keywords.some(kw => input.includes(kw))) {
          projectType = idea.name;
          break;
        }
      }
    }

    if (!projectType) {
      return { summary: "I'm here to help! Try 'make a todo app', 'create a website', or 'give me ideas'.", steps: [] };
    }

    const isFlutter = /flutter|android|apk|mobile/i.test(userInput);
    const isWebsite = /website|web|react|next|vue|frontend/i.test(userInput) || !isFlutter;

    let prompt;
    if (isFlutter) {
      prompt = `Create a complete Flutter mobile app. Current project: ${projectType}, files: ${fileList}.

Output ONLY valid JSON - no markdown, no explanations, no code blocks. Format:
{"summary": "Brief description", "steps": [{"action": "create_file|run_command|create_folder|github", "path": "file", "description": "what", "content": "code"}]}

IMPORTANT - Flutter requires full project structure:
1. {"action": "run_command", "description": "Create Flutter project", "command": "flutter create --org com.example --project-name todo_app ."}
2. {"action": "run_command", "description": "Get dependencies", "command": "flutter pub get"}
3. {"action": "run_command", "description": "Build debug APK", "command": "flutter build apk --debug"}
4. {"action": "github", "description": "Publish to GitHub", "command": "publish"}

For the main.dart, use modern Material Design 3 with clean UI, proper state management, and beautiful styling.

Output only valid JSON.`;
    } else {
      prompt = `Create a complete React website. Current project: ${projectType}, existing files: ${fileList}.

Output ONLY valid JSON - no markdown, no explanations, no code blocks. Format:
{"summary": "Brief description", "steps": [{"action": "create_file|run_command|create_folder|github", "path": "file", "description": "what", "content": "code"}]}

IMPORTANT - Use EXACT command strings:
- For npm install: use "npm install" (NOT "Install dependencies")
- For dev server: use "npm run dev" or "npm start"
- Create these files: package.json, src/App.jsx, src/App.css, public/index.html
- Use modern React with Material Design or Tailwind CSS for beautiful UI
- Add {"action": "github", "description": "Publish to GitHub", "command": "publish"} as the final step

For the UI: Use modern Material Design 3, clean components, nice gradients, shadows, and responsive layout. Make it look professional and visually appealing.

Output only valid JSON.`;
    }

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: "llama-3.1-8b",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        max_tokens: 12000
      })
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Cerebras API error: ${res.status} - ${err}`);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new Error("Empty response");

    try {
      let cleaned = text
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
        .trim();
      
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
      return JSON.parse(cleaned);
    } catch (e) {
      const lines = text.split('\n');
      let validLines = [];
      let braceCount = 0;
      let started = false;
      
      for (const line of lines) {
        const hasOpen = line.includes('{');
        const hasClose = line.includes('}');
        
        if (hasOpen && !started) {
          started = true;
          braceCount = (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
          validLines.push(line);
        } else if (started) {
          braceCount += (line.match(/{/g) || []).length;
          braceCount -= (line.match(/}/g) || []).length;
          validLines.push(line);
          if (braceCount <= 0) break;
        }
      }
      
      if (validLines.length > 0) {
        try {
          return JSON.parse(validLines.join('\n'));
        } catch {}
      }
      
      throw new Error("Invalid JSON: " + text.substring(0, 300));
    }
  }
}