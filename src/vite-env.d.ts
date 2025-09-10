/// <reference types="vite/client" />

interface Window {
  // expose in the `electron/preload/index.ts`
  ipcRenderer: import('electron').IpcRenderer
  electronAPI: {
    onFileOpened: (callback: (data: { path: string; content: string }) => void) => void;
    // Settings API
    getSettings: () => Promise<any>;
    setSettings: (settings: any) => Promise<void>;
    // History API
    saveHistory: (logs: any[]) => Promise<string>;
    getHistory: () => Promise<any[]>;
    loadHistoryEntry: (id: string) => Promise<any[]>;
    clearHistory: (id?: string) => Promise<void>;
  };
}
