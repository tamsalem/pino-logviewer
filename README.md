# Pino Log Viewer

A powerful desktop application for analyzing and visualizing Pino log files with AI-powered incident detection and analysis.

![Pino Log Viewer](https://img.shields.io/badge/Electron-Desktop%20App-blue)
![React](https://img.shields.io/badge/React-18+-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178c6)
![License](https://img.shields.io/badge/License-MIT-green)

## 🚀 Features

- **📁 File Support**: Drag & drop Pino log files (.log, .txt)
- **📋 Paste Support**: Paste raw log text directly
- **🔍 Advanced Search**: Real-time search with highlighting
- **⌨️ Keyboard Shortcuts**: Cmd/Ctrl+F for search, Page Up/Down for navigation
- **🤖 AI Incident Analysis**: Local LLM-powered incident detection and root cause analysis
- **📊 Error Categorization**: Automatic classification of errors (Database, Network, Auth, etc.)
- **📈 Spike Detection**: Identify error bursts and performance anomalies
- **💾 History Management**: Save and manage pasted log entries
- **⚙️ Settings**: Configurable retention periods and LLM setup
- **🎨 Modern UI**: Dark theme with responsive design

## 📋 Table of Contents

- [For Users](#for-users)
  - [Installation](#installation)
  - [Getting Started](#getting-started)
  - [Features Guide](#features-guide)
  - [AI Analysis Setup](#ai-analysis-setup)
  - [Keyboard Shortcuts](#keyboard-shortcuts)
  - [Troubleshooting](#troubleshooting)
- [For Developers](#for-developers)
  - [Prerequisites](#prerequisites)
  - [Development Setup](#development-setup)
  - [Project Structure](#project-structure)
  - [Architecture](#architecture)
  - [Contributing](#contributing)
  - [Building](#building)

---

## For Users

### Installation

#### Option 1: Download Pre-built Binary
1. Go to the [Releases](https://github.com/tamsalem/pino-logviewer/releases) page
2. Download the installer for your operating system
3. Run the installer and follow the setup wizard

#### Option 2: Build from Source
See the [For Developers](#for-developers) section for build instructions.

### Getting Started

1. **Launch the Application**
   - Open Pino Log Viewer from your applications folder
   - You'll see the welcome screen with options to load logs

2. **Load Log Files**
   - **Drag & Drop**: Drag a `.log` or `.txt` file onto the welcome screen
   - **Paste Text**: Click "Paste Raw Logs" and paste your log content
   - **File Menu**: Use File → Open to browse for log files

3. **Analyze Your Logs**
   - Use the search bar to find specific entries
   - Click on any log entry to see detailed information
   - Use the "Explain" button for AI-powered incident analysis

### Features Guide

#### 🔍 Search and Navigation
- **Search**: Type in the search bar to filter logs in real-time
- **Highlighting**: Search terms are highlighted in yellow
- **Keyboard Shortcuts**:
  - `Cmd/Ctrl + F`: Focus search input
  - `Page Up`: Jump to top of logs
  - `Page Down`: Jump to bottom of logs

#### 🤖 AI Incident Analysis
The app can automatically detect and analyze incidents in your logs:

- **Spike Detection**: Identifies sudden increases in error rates
- **Error Categorization**: Classifies errors into categories like:
  - Database issues (highest priority)
  - Authentication failures
  - Network problems
  - External API failures
  - And 16+ other categories
- **Root Cause Analysis**: Provides human-readable incident summaries
- **Timeline**: Shows when incidents occurred and their duration

#### 💾 History Management
- **Automatic Saving**: Pasted logs are automatically saved to history
- **Configurable Retention**: Set how long to keep history (1-365 days)
- **Quick Access**: Load previous log analyses from the settings panel

#### 🔍 Browser-like Search
- **Highlighting**: Search terms are highlighted in yellow within log entries
- **Position Indicator**: Shows current position (e.g., "1 of 5 matches")
- **Navigation**: Use Enter, F3, or Shift+F3 to navigate between results
- **Global Search**: Works from anywhere in the interface
- **Regex Support**: Supports regular expressions for advanced searching
- **Real-time**: Search results update as you type

### AI Analysis Setup

To enable AI-powered incident analysis, you need to set up a local LLM using Ollama:

#### 1. Install Ollama
```bash
# macOS
brew install ollama

# Linux
curl -fsSL https://ollama.ai/install.sh | sh

# Windows
# Download from https://ollama.ai/download
```

#### 2. Pull a Model
```bash
# Recommended model (good balance of speed and quality)
ollama pull llama3.1:8b

# Alternative models
ollama pull llama3.1:70b  # Higher quality, slower
ollama pull codellama:7b  # Code-focused model
```

#### 3. Start Ollama
```bash
ollama serve
```

#### 4. Verify Setup
- Open Pino Log Viewer
- Go to Settings (gear icon on welcome screen)
- Check the "Local AI (Ollama) Setup" section
- You should see a green indicator if Ollama is running

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + F` | Focus search input |
| `Enter` | Navigate to next search result (when search is active) |
| `F3` | Navigate to next search result |
| `Shift + F3` | Navigate to previous search result |
| `Page Up` | Jump to top of logs |
| `Page Down` | Jump to bottom of logs |
| `Escape` | Clear search / Close dialogs |

### Troubleshooting

#### Common Issues

**Q: AI analysis shows "No local LLM detected"**
- Make sure Ollama is installed and running (`ollama serve`)
- Check that you've pulled a model (`ollama pull llama3.1:8b`)
- Verify the model is available (`ollama list`)

**Q: App won't start or crashes**
- Check that you have Node.js 18+ installed
- Try deleting the app and reinstalling
- Check the console for error messages

**Q: Log files won't load**
- Ensure the file is a valid Pino log format
- Check file permissions
- Try copying the content and pasting it instead

**Q: Search not working**
- Make sure you're typing in the search box
- Try clearing the search and typing again
- Check that the log file loaded successfully

#### Getting Help
- Check the [Issues](https://github.com/tamsalem/pino-logviewer/issues) page
- Create a new issue with:
  - Your operating system
  - App version
  - Steps to reproduce the problem
  - Any error messages

---

## For Developers

### Prerequisites

- **Node.js**: 18.0.0 or higher
- **npm**: 8.0.0 or higher
- **Git**: For version control

### Development Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/tamsalem/pino-logviewer.git
   cd pino-logviewer
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Build for Production**
   ```bash
   npm run build
   ```

### Project Structure

```
pino-logviewer/
├── electron/                    # Electron main process
│   ├── main/                   # Main process code
│   │   └── index.ts           # App initialization, IPC handlers
│   └── preload/               # Preload scripts
│       └── index.ts           # Secure API exposure
├── src/                       # React renderer process
│   ├── components/            # React components (organized by purpose)
│   │   ├── ui/                # Reusable UI components
│   │   │   ├── LogEntry/      # Individual log entry component
│   │   │   ├── LogListView/   # Log list with search functionality
│   │   │   └── LogToolbar/    # Toolbar with search and controls
│   │   ├── features/          # Feature-specific components
│   │   │   ├── LogDisplay/    # Main log display component
│   │   │   ├── Dashboard/     # Analytics dashboard
│   │   │   ├── IncidentDrawer/# AI analysis drawer
│   │   │   ├── LogUploader/   # File upload functionality
│   │   │   ├── LogPaste/      # Paste functionality
│   │   │   ├── HistoryScreen/ # Log history management
│   │   │   └── WelcomeScreen/ # Landing page
│   │   └── layout/            # Layout components
│   │       ├── Layout/        # Main app layout
│   │       └── SettingsSidebar/# Settings panel
│   ├── constants/             # App-wide constants
│   │   └── index.ts           # Log levels, colors, API endpoints
│   ├── services/              # External services and APIs
│   │   └── analysis/          # Log analysis logic
│   │       └── index.ts       # Incident detection, LLM integration
│   ├── types/                 # TypeScript type definitions
│   │   ├── logs.ts            # Log entry types
│   │   └── index.ts           # Type exports
│   ├── utils/                 # Utility functions and helpers
│   │   ├── electron-api.ts    # Electron API wrapper
│   │   ├── export-utils.ts    # Export functionality
│   │   ├── helpers.ts         # General helper functions
│   │   └── index.ts           # Utility exports
│   ├── demos/                 # Demo files
│   │   ├── ipc.ts             # IPC demo
│   │   └── node.ts            # Node.js demo
│   ├── App.tsx                # Main React component
│   ├── App.css                # App-specific styles
│   ├── index.css              # Global styles
│   ├── main.tsx               # React entry point
│   └── vite-env.d.ts          # Vite type definitions
├── components/                # Shadcn/UI components
│   └── ui/                    # Reusable UI primitives
├── public/                    # Static assets
├── dist/                      # Built renderer
├── dist-electron/             # Built main process
└── release/                   # Packaged applications
```

### Architecture

#### Main Process (`electron/main/`)
- **Window Management**: Creates and manages the main window
- **File Operations**: Handles file opening and reading
- **IPC Handlers**: Secure communication with renderer
- **Settings Storage**: Manages user preferences and history
- **LLM Integration**: Communicates with local Ollama instance

#### Renderer Process (`src/`)
- **Component Architecture**: Organized by purpose (UI, features, layout)
- **Type Safety**: Centralized TypeScript definitions
- **Constants Management**: App-wide configuration and constants
- **Service Layer**: External integrations and analysis logic
- **Utility Functions**: Reusable helper functions and APIs
- **State Management**: React hooks for local state
- **Log Parsing**: Pino log format parsing with browser-like search
- **AI Analysis**: Incident detection and categorization

#### Key Technologies
- **Electron**: Cross-platform desktop framework
- **React 18**: UI framework with hooks
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first styling
- **Radix UI**: Accessible component primitives
- **Framer Motion**: Smooth animations

### Contributing

#### Development Workflow

1. **Fork the Repository**
   ```bash
   git fork https://github.com/tamsalem/pino-logviewer.git
   ```

2. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make Changes**
   - Follow the existing code style
   - Add TypeScript types for new features
   - Update tests if applicable
   - Update documentation

4. **Test Your Changes**
   ```bash
   npm run dev          # Test in development
   npm run build        # Test production build
   npm test             # Run tests
   ```

5. **Submit a Pull Request**
   - Provide a clear description
   - Include screenshots for UI changes
   - Reference any related issues

#### Code Style Guidelines

- **TypeScript**: Use strict typing, avoid `any`
- **React**: Use functional components with hooks
- **Styling**: Use Tailwind CSS classes
- **Naming**: Use descriptive, camelCase names
- **Comments**: Document complex logic
- **Error Handling**: Always handle errors gracefully

#### Testing

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Preview production build
npm run preview
```

### Building

#### Development Build
```bash
npm run dev
```

#### Production Build
```bash
npm run build
```

#### Package for Distribution
```bash
npm run build        # Builds and packages for macOS (current platform)
npm run debug-build  # Builds with debug logging
```

#### Build Output
- **Development**: `dist/` and `dist-electron/`
- **Production**: `release/` with platform-specific installers

### Environment Variables

Create a `.env` file for development:

```env
# Development settings
NODE_ENV=development
ELECTRON_IS_DEV=true

# LLM settings (optional)
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b
```

### Debugging

#### Main Process Debugging
- Use VS Code debugger configuration
- Add breakpoints in `electron/main/index.ts`
- Check console output in terminal

#### Renderer Process Debugging
- Use Chrome DevTools (Cmd/Ctrl+Shift+I)
- React Developer Tools extension
- Network tab for API calls

#### Common Debug Commands
```bash
# Check Electron version
npx electron --version

# Check Node.js version
node --version

# Check npm version
npm --version

# Clear npm cache
npm cache clean --force
```

### Performance Considerations

- **Large Log Files**: The app handles files up to 100MB efficiently
- **Memory Usage**: Logs are processed in chunks to prevent memory issues
- **Search Performance**: Debounced search with virtual scrolling
- **LLM Responses**: Cached to prevent re-generation

### Security

- **IPC Security**: All main process communication is secured
- **File Access**: Limited to user-selected files
- **LLM Integration**: Local-only, no external API calls
- **Data Storage**: Settings and history stored locally

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guidelines](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/tamsalem/pino-logviewer/issues)
- **Discussions**: [GitHub Discussions](https://github.com/tamsalem/pino-logviewer/discussions)
- **Email**: tamsalem@paloaltonetworks.com

---

Made with ❤️ for the developer community
