// Electron API wrapper for type safety
export const electronAPI = {
  onFileOpened: (callback: (data: { path: string; content: string }) => void) => {
    window.electronAPI.onFileOpened(callback);
  },
  
  // Settings API
  getSettings: () => window.ipcRenderer.invoke('get-settings'),
  setSettings: (settings: any) => window.ipcRenderer.invoke('set-settings', settings),
  
  // History API
  saveHistory: (logs: any[]) => window.ipcRenderer.invoke('save-history', logs),
  getHistory: () => window.ipcRenderer.invoke('get-history'),
  loadHistoryEntry: (id: string) => window.ipcRenderer.invoke('load-history-entry', id),
  clearHistory: () => window.ipcRenderer.invoke('clear-history'),
};
