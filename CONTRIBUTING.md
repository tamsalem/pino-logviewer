# Contributing to Pino Log Viewer

Thank you for your interest in contributing! This guide will help you get started with development.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [Development Workflow](#development-workflow)
- [Code Guidelines](#code-guidelines)
- [Testing](#testing)
- [Building](#building)
- [Debugging](#debugging)

## Prerequisites

- **Node.js**: 18.0.0 or higher
- **npm**: 8.0.0 or higher
- **Git**: For version control

## Development Setup

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

## Project Structure

```
pino-logviewer/
├── electron/                    # Electron main process
│   ├── main/                   # Main process code
│   │   └── index.ts           # App initialization, IPC handlers
│   └── preload/               # Preload scripts
│       └── index.ts           # Secure API exposure
├── src/                       # React renderer process
│   ├── components/            # React components
│   │   ├── ui/                # Reusable UI components
│   │   │   ├── LogEntry/      # Individual log entry
│   │   │   ├── LogListView/   # Log list with search
│   │   │   └── LogToolbar/    # Toolbar with controls
│   │   ├── features/          # Feature components
│   │   │   ├── LogDisplay/    # Main log display
│   │   │   ├── Dashboard/     # Analytics dashboard
│   │   │   ├── IncidentDrawer/# AI analysis drawer
│   │   │   ├── LogUploader/   # File upload
│   │   │   ├── LogPaste/      # Paste functionality
│   │   │   ├── HistoryScreen/ # Log history
│   │   │   └── WelcomeScreen/ # Landing page
│   │   └── layout/            # Layout components
│   │       ├── Layout/        # Main app layout
│   │       └── SettingsSidebar/# Settings panel
│   ├── constants/             # App-wide constants
│   ├── services/              # External services
│   │   └── analysis/          # Log analysis logic
│   ├── types/                 # TypeScript definitions
│   ├── utils/                 # Utility functions
│   ├── App.tsx                # Main React component
│   └── main.tsx               # React entry point
├── components/                # Shadcn/UI components
│   └── ui/                    # Reusable UI primitives
├── public/                    # Static assets
├── dist/                      # Built renderer
├── dist-electron/             # Built main process
└── release/                   # Packaged applications
```

## Architecture

### Main Process (`electron/main/`)
- **Window Management**: Creates and manages the main window
- **File Operations**: Handles file opening and reading
- **IPC Handlers**: Secure communication with renderer
- **Settings Storage**: Manages user preferences and history
- **LLM Integration**: Communicates with local Ollama instance

### Renderer Process (`src/`)
- **Component Architecture**: Organized by purpose (UI, features, layout)
- **Type Safety**: Centralized TypeScript definitions
- **State Management**: React hooks for local state
- **Log Parsing**: Pino log format parsing
- **AI Analysis**: Incident detection and categorization

### Key Technologies
- **Electron**: Cross-platform desktop framework
- **React 18**: UI framework with hooks
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first styling
- **Radix UI**: Accessible component primitives
- **Framer Motion**: Smooth animations
- **Sonner**: Toast notifications

## Development Workflow

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

## Code Guidelines

### TypeScript
- Use strict typing, avoid `any`
- Define interfaces for all data structures
- Use type inference where appropriate

### React
- Use functional components with hooks
- Keep components small and focused
- Use meaningful component and prop names

### Styling
- Use Tailwind CSS classes
- Use CSS variables for theme colors (e.g., `var(--logviewer-text-primary)`)
- Ensure both light and dark theme support

### Naming Conventions
- **Components**: PascalCase (e.g., `LogEntry`)
- **Functions**: camelCase (e.g., `handleCopyToClipboard`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `LOG_LEVEL_OPTIONS`)
- **Files**: Match component name (e.g., `LogEntry/index.tsx`)

### Comments
- Document complex logic
- Use JSDoc for public APIs
- Explain "why" not "what"

### Error Handling
- Always handle errors gracefully
- Show user-friendly error messages
- Log errors for debugging

## Testing

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

## Building

### Development Build
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

### Package for Distribution
```bash
npm run build        # Builds and packages for macOS
npm run debug-build  # Builds with debug logging
```

### Build Output
- **Development**: `dist/` and `dist-electron/`
- **Production**: `release/` with platform-specific installers

## Debugging

### Main Process
- Use VS Code debugger configuration
- Add breakpoints in `electron/main/index.ts`
- Check console output in terminal

### Renderer Process
- Use Chrome DevTools (`Cmd/Ctrl+Shift+I`)
- React Developer Tools extension
- Network tab for API calls

### Common Debug Commands
```bash
# Check versions
npx electron --version
node --version
npm --version

# Clear npm cache
npm cache clean --force
```

## Environment Variables

Create a `.env` file for development:

```env
# Development settings
NODE_ENV=development
ELECTRON_IS_DEV=true

# LLM settings (optional)
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b
```

## Performance Considerations

- **Large Log Files**: App handles files up to 100MB efficiently
- **Memory Usage**: Logs processed in chunks
- **Search Performance**: Debounced search with virtual scrolling
- **LLM Responses**: Cached to prevent re-generation

## Security

- **IPC Security**: All main process communication is secured
- **File Access**: Limited to user-selected files
- **LLM Integration**: Local-only, no external API calls
- **Data Storage**: Settings and history stored locally

## Questions?

- Check existing [Issues](https://github.com/tamsalem/pino-logviewer/issues)
- Start a [Discussion](https://github.com/tamsalem/pino-logviewer/discussions)
- Email: tamsalem@paloaltonetworks.com

---

Thank you for contributing! 🎉