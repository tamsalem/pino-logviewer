import React, { useState, useEffect } from 'react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '../../../../components/ui/popover';
import { Copy, Check, Settings, Clock } from 'lucide-react';
import { electronAPI } from '../../../utils';

interface SettingsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsSidebar({ isOpen, onClose }: SettingsSidebarProps) {
  const [retentionDays, setRetentionDays] = useState(7);
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);
  const [ollamaStatus, setOllamaStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

  useEffect(() => {
    if (isOpen) {
      loadSettings();
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

  const saveSettings = async () => {
    try {
      await electronAPI.setSettings({ retentionDays });
    } catch (error) {
      console.error('Failed to save settings:', error);
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

          {/* History Retention Settings Section */}
          <Card className="bg-gray-800/60 border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-200 text-base flex items-center gap-2">
                <Clock className="w-4 h-4" />
                History Retention
              </CardTitle>
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

        </div>
      </div>
    </div>
  );
}

