# 🤖 codevagent

> **AI-Powered CLI Developer Agent** — Your autonomous coding team in the terminal 🦊

An intelligent AI agent that plans, builds, and fixes your code projects. Just describe what you want, and watch it happen.

## 🚀 Quick Start

### Install globally

```bash
npm install -g codevagent
```

### Set API Key

```bash
# Option 1: Environment variable (recommended)
export GROQ_API_KEY="your-groq-api-key"

# Option 2: Config file
# Create ~/.codevagent/config.json
{
  "groqApiKey": "your-groq-api-key",
  "openrouterApiKey": "optional-key"
}
```

### Run

```bash
codevagent
```

## 📖 Usage

```bash
codevagent                    # Interactive mode
codevagent my-app             # Create/open "my-app" in current directory
codevagent /path/to/project   # Open specific project path
```

## ✨ Features

- 🧠 **Multi-AI agent architecture** — Planner, Executor, and Specialist agents
- 🦊 **Fox mascot** — Your friendly coding companion with emotions
- 📁 **Smart workspace detection** — Understands your project structure
- 🔒 **Sandboxed operations** — Safe file and command execution
- ⚡ **Streaming output** — Real-time feedback
- 🔄 **Auto-fix loop** — Specialist agent fixes failures automatically
- ♻️ **No prompts** — Configuration via env vars or config file

## 🔑 API Keys

### Required: Groq API Key
Get one at [console.groq.com](https://console.groq.com)

| Key | Source|
|-----|--------|
| Groq API | ✅ Required | [console.groq.com](https://console.groq.com) |
| OpenRouter API | Optional | [openrouter.ai](https://openrouter.ai) |

## 🎨 Interface

The app features:
- ASCII art branding with gradient colors
- Fox mascot with different emotional states
- Rich terminal UI with boxed output
- Real-time streaming responses

## 📋 What It Can Do

Describe any development task in natural language:
- Create new projects with proper structure
- Generate code files from descriptions
- Edit existing files based on requirements
- Run build commands and deployments
- Fix errors automatically with specialist agent
- Maintain project context across conversations
