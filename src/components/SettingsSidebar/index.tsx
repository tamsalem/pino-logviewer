import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/popover';
import { Copy, Check, Settings, History, Trash2, Info } from 'lucide-react';
import { electronAPI } from '../../lib/electron-api';

interface SettingsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadHistory?: (logs: any[]) => void;
}

interface HistoryEntry {
  id: string;
  timestamp: number;
  logCount: number;
  preview: string;
}

export function SettingsSidebar({ isOpen, onClose, onLoadHistory }: SettingsSidebarProps) {
  const [retentionDays, setRetentionDays] = useState(7);
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);
  const [ollamaStatus, setOllamaStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [isStorageInfoOpen, setIsStorageInfoOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSettings();
      loadHistory();
      checkOllamaStatus();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    try {
      const settings = await electronAPI.getSettings();
      setRetentionDays(settings.retentionDays || 7);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const loadHistory = async () => {
    try {
      const history = await electronAPI.getHistory();
      setHistoryEntries(history);
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  const saveSettings = async () => {
    try {
      await electronAPI.setSettings({ retentionDays });
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const clearHistory = async () => {
    try {
      await electronAPI.clearHistory();
      setHistoryEntries([]);
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  };

  const loadHistoryEntry = async (id: string) => {
    try {
      const logs = await electronAPI.loadHistoryEntry(id);
      if (onLoadHistory) {
        onLoadHistory(logs);
      }
      onClose();
    } catch (error) {
      console.error('Failed to load history entry:', error);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCommand(text);
      setTimeout(() => setCopiedCommand(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const checkOllamaStatus = async () => {
    setOllamaStatus('checking');
    try {
      const response = await fetch('http://localhost:11434/api/tags');
      setOllamaStatus(response.ok ? 'connected' : 'disconnected');
    } catch (error) {
      setOllamaStatus('disconnected');
    }
  };

  const ollamaCommands = [
    'curl -fsSL https://ollama.ai/install.sh | sh',
    'ollama serve',
    'ollama pull llama3.1:8b'
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-96 bg-gray-900 border-l border-gray-700 shadow-2xl p-6 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-200 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Settings
          </h2>
          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="space-y-6">
          {/* LLM Setup Section */}
          <Card className="bg-gray-800/60 border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-gray-200 text-base flex items-center gap-2">
                  Local LLM Setup (Ollama)
                  <div className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${
                      ollamaStatus === 'connected' ? 'bg-green-500' :
                      ollamaStatus === 'disconnected' ? 'bg-red-500' :
                      'bg-yellow-500 animate-pulse'
                    }`} />
                    <span className="text-xs text-gray-400">
                      {ollamaStatus === 'connected' ? 'Connected' :
                       ollamaStatus === 'disconnected' ? 'Disconnected' :
                       'Checking...'}
                    </span>
                  </div>
                </CardTitle>
              </div>
              <CardDescription className="text-gray-400">
                Set up Ollama for AI-powered incident analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="text-gray-300 text-sm">1. Install Ollama</label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 bg-gray-900 text-gray-300 text-xs p-2 rounded border">
                      {ollamaCommands[0]}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(ollamaCommands[0])}
                      className="text-gray-400 hover:text-white"
                    >
                      {copiedCommand === ollamaCommands[0] ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-gray-300 text-sm">2. Start Ollama Server</label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 bg-gray-900 text-gray-300 text-xs p-2 rounded border">
                      {ollamaCommands[1]}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(ollamaCommands[1])}
                      className="text-gray-400 hover:text-white"
                    >
                      {copiedCommand === ollamaCommands[1] ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-gray-300 text-sm">3. Download Model</label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 bg-gray-900 text-gray-300 text-xs p-2 rounded border">
                      {ollamaCommands[2]}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(ollamaCommands[2])}
                      className="text-gray-400 hover:text-white"
                    >
                      {copiedCommand === ollamaCommands[2] ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </div>

              <div className={`border rounded p-3 ${
                ollamaStatus === 'connected' 
                  ? 'bg-green-900/20 border-green-700/50' 
                  : 'bg-blue-900/20 border-blue-700/50'
              }`}>
                <p className={`text-xs ${
                  ollamaStatus === 'connected' ? 'text-green-200' : 'text-blue-200'
                }`}>
                  <strong>Status:</strong> {ollamaStatus === 'connected' 
                    ? 'Ollama is running and ready for AI analysis.' 
                    : 'The AI incident explainer will automatically use Ollama when available. If not detected, it falls back to heuristic analysis.'}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="border-t border-gray-700" />

          {/* History Settings Section */}
          <Card className="bg-gray-800/60 border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-gray-200 text-base flex items-center gap-2">
                  <History className="w-4 h-4" />
                  History Settings
                </CardTitle>
                <Popover open={isStorageInfoOpen} onOpenChange={setIsStorageInfoOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-white p-1 h-auto"
                    >
                      <Info className="w-4 h-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 bg-gray-800 border-gray-700 text-gray-200">
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-200">Storage Information</h4>
                      <div className="space-y-2 text-sm">
                        <p className="text-gray-300">
                          <strong>Location:</strong> <code className="text-gray-400">~/.pino-logviewer/history/</code>
                        </p>
                        <p className="text-gray-400">
                          History files are stored locally on your machine and automatically cleaned up based on your retention settings.
                        </p>
                        <p className="text-gray-400">
                          Each pasted log entry is saved as a separate JSON file with a unique identifier.
                        </p>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <CardDescription className="text-gray-400">
                Configure how long to keep pasted log history
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="retention-days" className="text-gray-300 text-sm">
                  Retention Period (days)
                </label>
                <Input
                  id="retention-days"
                  type="number"
                  min="1"
                  max="365"
                  value={retentionDays}
                  onChange={(e) => setRetentionDays(parseInt(e.target.value) || 7)}
                  className="mt-1 bg-gray-900 border-gray-600 text-gray-200"
                />
                <p className="text-gray-500 text-xs mt-1">
                  Pasted logs will be automatically deleted after this many days
                </p>
              </div>

              <Button 
                onClick={saveSettings}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Save Settings
              </Button>
            </CardContent>
          </Card>

          <div className="border-t border-gray-700" />

          {/* History Management Section */}
          <Card className="bg-gray-800/60 border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-200 text-base flex items-center gap-2">
                <History className="w-4 h-4" />
                Log History
              </CardTitle>
              <CardDescription className="text-gray-400">
                Manage your pasted log history
              </CardDescription>
            </CardHeader>
            <CardContent>
              {historyEntries.length === 0 ? (
                <p className="text-gray-500 text-sm">No history entries found</p>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 text-sm">
                      {historyEntries.length} entries
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={clearHistory}
                      className="text-red-400 hover:text-red-300 flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Clear All
                    </Button>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {historyEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className="bg-gray-900/60 border border-gray-700 rounded p-3 cursor-pointer hover:bg-gray-800/60 transition-colors"
                        onClick={() => loadHistoryEntry(entry.id)}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-gray-300 text-xs font-mono">
                            {entry.id.substring(0, 8)}...
                          </span>
                          <span className="text-gray-500 text-xs">
                            {new Date(entry.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-gray-400 text-xs mb-1">
                          {entry.logCount} logs
                        </div>
                        <div className="text-gray-500 text-xs truncate">
                          {entry.preview}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
