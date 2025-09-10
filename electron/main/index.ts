import { app, BrowserWindow, shell, ipcMain } from 'electron'
import fs from 'node:fs/promises';
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import os from 'node:os'
import { randomUUID } from 'node:crypto'
import { update } from './update'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
// keep file paths that arrive before renderer is ready
const pendingOpenPaths: string[] = [];
let rendererReady = false;

// Settings and history storage
const SETTINGS_FILE = path.join(os.homedir(), '.pino-logviewer', 'settings.json');
const HISTORY_DIR = path.join(os.homedir(), '.pino-logviewer', 'history');

interface Settings {
  retentionDays: number;
}

interface HistoryEntry {
  id: string;
  timestamp: number;
  logCount: number;
  preview: string;
  logs: any[];
}

// Ensure directories exist
async function ensureDirectories() {
  const settingsDir = path.dirname(SETTINGS_FILE);
  await fs.mkdir(settingsDir, { recursive: true });
  await fs.mkdir(HISTORY_DIR, { recursive: true });
}

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.mjs   > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
process.env.APP_ROOT = path.join(__dirname, '../..')

async function readFiles(paths: string[]): Promise<{ path: string; content: string }> {
    const entries = await Promise.all(paths.map(async (p) => {
        try {
            const content = await fs.readFile(p, 'utf8');
            return { path: p, content } as { path: string; content: string };
        } catch (e) {
            throw e
        }
    }));
    return entries[0]!;
}

async function flushPendingFiles() {
    if (!win || !rendererReady || pendingOpenPaths.length === 0) return;
    const paths = pendingOpenPaths.splice(0, pendingOpenPaths.length);
    const files = await readFiles(paths);
    win.webContents.send('open-file', files); // <— send path+content directly
}

export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
    ? path.join(process.env.APP_ROOT, 'public')
    : RENDERER_DIST

// Disable GPU Acceleration for Windows 7
if (os.release().startsWith('6.1')) app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

let win: BrowserWindow | null = null
const preload = path.join(__dirname, '../preload/index.mjs')
const indexHtml = path.join(RENDERER_DIST, 'index.html')

async function createWindow() {
    win = new BrowserWindow({
        title: 'Main window',
        icon: path.join(process.env.VITE_PUBLIC, 'favicon.ico'),
        webPreferences: {
            preload,
            // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
            // nodeIntegration: true,

            // Consider using contextBridge.exposeInMainWorld
            // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
            // contextIsolation: false,
        },
    })

    if (VITE_DEV_SERVER_URL) { // #298
        win.loadURL(VITE_DEV_SERVER_URL)
        // Open devTool if the app is not packaged
        win.webContents.openDevTools()
    } else {
        win.loadFile(indexHtml)
    }

    // Test actively push message to the Electron-Renderer
    win.webContents.on('did-finish-load', () => {
        win?.webContents.send('main-process-message', new Date().toLocaleString())
        void flushPendingFiles()
    })

    // Make all links open with the browser, not with the application
    win.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('https:')) shell.openExternal(url)
        return { action: 'deny' }
    })

    win.webContents.on('did-finish-load', () => {
        rendererReady = true;
        flushPendingFiles(); // send any queued files as soon as renderer is ready
    });

    // Auto update
    update(win)
}

app.whenReady().then(async () => {
  await ensureDirectories();
  createWindow();
})

app.on('window-all-closed', () => {
    win = null
    if (process.platform !== 'darwin') app.quit()
})

app.on('second-instance', () => {
    if (win) {
        // Focus on the main window if the user tried to open another
        if (win.isMinimized()) win.restore()
        win.focus()
    }
})

app.on('activate', () => {
    const allWindows = BrowserWindow.getAllWindows()
    if (allWindows.length) {
        allWindows[0].focus()
    } else {
        createWindow()
    }
})

// macOS: file opened via Finder/Dock (app not yet ready or already running)
app.on('open-file', (event, filePath) => {
    event.preventDefault();
    // // accept only the types you want
    // if (!/\.(log|txt)$/i.test(filePath)) return;
    pendingOpenPaths.push(filePath);
    void flushPendingFiles();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

// Settings IPC handlers
ipcMain.handle('get-settings', async () => {
  try {
    const data = await fs.readFile(SETTINGS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return { retentionDays: 7 }; // default
  }
});

ipcMain.handle('set-settings', async (_, settings: Settings) => {
  await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2));
});

// History IPC handlers
ipcMain.handle('save-history', async (_, logs: any[]) => {
  const id = randomUUID();
  const timestamp = Date.now();
  const preview = logs.length > 0 ? logs[0].message || logs[0].raw || 'No preview' : 'Empty log';
  
  const entry: HistoryEntry = {
    id,
    timestamp,
    logCount: logs.length,
    preview: preview.substring(0, 100),
    logs
  };
  
  const historyFile = path.join(HISTORY_DIR, `${id}.json`);
  await fs.writeFile(historyFile, JSON.stringify(entry, null, 2));
  
  // Clean up old entries
  await cleanupOldHistory();
  
  return id;
});

ipcMain.handle('get-history', async () => {
  try {
    const files = await fs.readdir(HISTORY_DIR);
    const entries: HistoryEntry[] = [];
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(HISTORY_DIR, file);
        const data = await fs.readFile(filePath, 'utf8');
        const entry = JSON.parse(data);
        entries.push({
          id: entry.id,
          timestamp: entry.timestamp,
          logCount: entry.logCount,
          preview: entry.preview,
          logs: [] // We don't need to load the full logs for the list view
        });
      }
    }
    
    return entries.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    return [];
  }
});

ipcMain.handle('load-history-entry', async (_, id: string) => {
  try {
    const historyFile = path.join(HISTORY_DIR, `${id}.json`);
    const data = await fs.readFile(historyFile, 'utf8');
    const entry: HistoryEntry = JSON.parse(data);
    
    if (!entry.logs || !Array.isArray(entry.logs)) {
      console.error('Invalid entry data - logs is not an array:', entry);
      throw new Error('Invalid entry data - logs is not an array');
    }
    
    return entry.logs;
  } catch (error) {
    console.error('Failed to load history entry:', error);
    throw new Error(`Failed to load history entry: ${error.message}`);
  }
});

ipcMain.handle('clear-history', async (_, id?: string) => {
  if (id) {
    // Clear specific entry
    const historyFile = path.join(HISTORY_DIR, `${id}.json`);
    try {
      await fs.unlink(historyFile);
    } catch (error) {
      console.error('Failed to delete history entry:', error);
    }
  } else {
    // Clear all history
    const files = await fs.readdir(HISTORY_DIR);
    for (const file of files) {
      if (file.endsWith('.json')) {
        await fs.unlink(path.join(HISTORY_DIR, file));
      }
    }
  }
});

async function cleanupOldHistory() {
  try {
    const settings = await fs.readFile(SETTINGS_FILE, 'utf8');
    const { retentionDays } = JSON.parse(settings);
    const cutoffTime = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);
    
    const files = await fs.readdir(HISTORY_DIR);
    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(HISTORY_DIR, file);
        const data = await fs.readFile(filePath, 'utf8');
        const entry = JSON.parse(data);
        
        if (entry.timestamp < cutoffTime) {
          await fs.unlink(filePath);
        }
      }
    }
  } catch (error) {
    // Ignore cleanup errors
  }
}

// New window example arg: new windows url
ipcMain.handle('open-win', (_, arg) => {
    const childWindow = new BrowserWindow({
        webPreferences: {
            preload,
            nodeIntegration: true,
            contextIsolation: false,
        },
    })

    if (VITE_DEV_SERVER_URL) {
        childWindow.loadURL(`${VITE_DEV_SERVER_URL}#${arg}`)
    } else {
        childWindow.loadFile(indexHtml, { hash: arg })
    }
})