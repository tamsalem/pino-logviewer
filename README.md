# Pino Log Viewer

A powerful desktop application for analyzing and visualizing Pino log files with AI-powered incident detection.

![Pino Log Viewer](https://img.shields.io/badge/Electron-Desktop%20App-blue)
![React](https://img.shields.io/badge/React-18+-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178c6)
![License](https://img.shields.io/badge/License-MIT-green)

## ✨ Features

- 📁 **Drag & Drop** - Load `.log` and `.txt` files instantly
- 📋 **Paste Support** - Paste raw log text directly
- 🔍 **Smart Search** - Real-time search with regex support and highlighting
- 🤖 **AI Analysis** - Local LLM-powered incident detection and root cause analysis
- 📊 **Error Categorization** - Automatic classification (Database, Network, Auth, etc.)
- 📈 **Spike Detection** - Identify error bursts and anomalies
- 💾 **History** - Save and manage pasted logs
- 🎨 **Modern UI** - Dark/Light theme with smooth animations
- ⌨️ **Keyboard Shortcuts** - Efficient navigation and search

## 🚀 Quick Start

### Installation

#### Download Pre-built App
1. Go to [Releases](https://github.com/tamsalem/pino-logviewer/releases)
2. Download the installer for your OS
3. Install and launch

#### Build from Source
See [CONTRIBUTING.md](CONTRIBUTING.md) for developer setup.

### Using the App

1. **Load Logs**
   - Drag & drop a log file onto the window
   - Or click "Paste Raw Logs" and paste your content
   - Or use File → Open

2. **Search & Filter**
   - Type in the search bar (supports regex)
   - Use filters to show specific log levels
   - Navigate with keyboard shortcuts

3. **Analyze Incidents**
   - Click the ✨ Sparkles button for AI analysis
   - View error categorization and timeline
   - Get root cause suggestions

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + F` | Focus search |
| `Enter` / `F3` | Next search result |
| `Shift + F3` | Previous search result |
| `Page Up/Down` | Jump to top/bottom |
| `Escape` | Clear search |

## 🤖 AI Analysis Setup (Optional)

To enable AI-powered incident analysis:

1. **Install Ollama**
   ```bash
   # macOS
   brew install ollama
   
   # Linux
   curl -fsSL https://ollama.ai/install.sh | sh
   
   # Windows - Download from https://ollama.ai/download
   ```

2. **Pull a Model**
   ```bash
   ollama pull llama3.1:8b
   ```

3. **Start Ollama**
   ```bash
   ollama serve
   ```

4. **Verify** - Check the green indicator in the app toolbar

## 🔧 Troubleshooting

**AI analysis not working?**
- Ensure Ollama is running: `ollama serve`
- Check you have a model: `ollama list`

**Log files won't load?**
- Verify it's a valid Pino log format
- Try pasting the content instead

**Need help?**
- Check [Issues](https://github.com/tamsalem/pino-logviewer/issues)
- Create a new issue with your OS, app version, and error details

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for:
- Development setup
- Project structure
- Code guidelines
- Build instructions

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/tamsalem/pino-logviewer/issues)
- **Discussions**: [GitHub Discussions](https://github.com/tamsalem/pino-logviewer/discussions)
- **Email**: tamsalem@paloaltonetworks.com

---

Made with ❤️ for the developer community
