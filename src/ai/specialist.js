/**
 * SPECIALIST — OpenRouter-powered expert
 * Handles complex bugs, optimizations, and edge cases
 */

export class Specialist {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://openrouter.ai/api/v1';
  }

  /**
   * Analyze an error and produce a fix step
   */
  async fix(failedStep, error, context) {
    const prompt = `A build step failed. Analyze and provide a fix.

FAILED STEP:
${JSON.stringify(failedStep, null, 2)}

ERROR:
${error}

PROJECT TYPE: ${context.type}
FILES: ${context.files.map(f => f.path).join(', ')}

Respond with a single JSON object representing a corrected step:
{
  "action": "create_file" | "edit_file" | "run_command",
  "description": "what this fix does",
  "path": "file path if applicable",
  "content": "file content if applicable",
  "command": "command if applicable"
}`;

    try {
      const res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'anthropic/claude-3.5-sonnet',
          messages: [
            { role: 'system', content: 'You are an expert debugger. Output valid JSON only.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.2,
        }),
      });

      if (!res.ok) return null;

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content || '';
      const match = text.match(/\{[\s\S]*\}/);
      return match ? JSON.parse(match[0]) : null;
    } catch {
      return null;
    }
  }
}
