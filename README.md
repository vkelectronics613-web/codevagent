# 🤖 CodeVagent

> **AI-Powered CLI Developer Agent** — Your autonomous coding team in the terminal 🦊

An intelligent AI agent that builds websites, mobile apps, and publishes to GitHub. Just describe what you want!

## 🚀 Quick Start

```bash
npm install -g codevagent
```

### Add Your API Keys

Edit `config.json` in the installed folder:
```json
{
  "cerebrasApiKey": "YOUR_CEREBRAS_API_KEY",
  "githubToken": "YOUR_GITHUB_TOKEN"
}
```

**Get Cerebras API Key:** https://cloud.cerebras.ai

**Get GitHub Token:** https://github.com/settings/tokens (select "repo" scope)

### Run

```bash
codevagent
```

## 📖 Usage

```bash
codevagent                    # Interactive mode
codevagent my-app             # Create/open project in current directory
```

## ✨ Features

- 🧠 **AI Code Generation** — Creates complete React websites & Flutter mobile apps
- 🦊 **Fox Mascot** — Your friendly coding companion
- 📱 **Mobile Apps** — Flutter apps with Material Design 3
- 🌐 **Websites** — React apps with modern UI
- 📦 **Auto-Publish** — Pushes directly to GitHub
- 🔒 **Sandboxed** — Safe file operations

## 🎨 Example Commands

```
make a todo app          → Creates React todo app + GitHub
make a todo android app  → Creates Flutter APK + GitHub
publish to github        → Push current project to GitHub
give me ideas            → Project ideas
```

## 📋 What It Can Do

- Create React websites with beautiful UI
- Create Flutter mobile apps (APK)
- Auto-run websites on localhost
- Auto-publish to GitHub
- Fix errors automatically

---

**Website:** https://github.com/vkelectronics613-web/codevagent
