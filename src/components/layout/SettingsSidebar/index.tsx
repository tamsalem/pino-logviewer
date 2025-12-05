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
      <div 
        className="absolute right-0 top-0 h-full w-96 border-l shadow-2xl p-6 overflow-auto"
        style={{
          backgroundColor: 'var(--logviewer-bg-primary)',
          borderColor: 'var(--logviewer-border-primary)'
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--logviewer-text-primary)' }}>
            <Settings className="w-5 h-5" />
            Settings
          </h2>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            style={{ color: 'var(--logviewer-text-secondary)' }}
          >
            Close
          </Button>
        </div>

        <div className="space-y-6">
          {/* LLM Setup Section */}
          <Card 
            className="border"
            style={{
              backgroundColor: 'var(--logviewer-bg-secondary)',
              borderColor: 'var(--logviewer-border-primary)'
            }}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2" style={{ color: 'var(--logviewer-text-primary)' }}>
                  Local LLM Setup (Ollama)
                  <div className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${
                      ollamaStatus === 'connected' ? 'bg-green-500' :
                      ollamaStatus === 'disconnected' ? 'bg-red-500' :
                      'bg-yellow-500 animate-pulse'
                    }`} />
                    <span className="text-xs" style={{ color: 'var(--logviewer-text-secondary)' }}>
                      {ollamaStatus === 'connected' ? 'Connected' :
                       ollamaStatus === 'disconnected' ? 'Disconnected' :
                       'Checking...'}
                    </span>
                  </div>
                </CardTitle>
              </div>
              <CardDescription style={{ color: 'var(--logviewer-text-secondary)' }}>
                Set up Ollama for AI-powered incident analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="text-sm" style={{ color: 'var(--logviewer-text-primary)' }}>1. Install Ollama</label>
                  <div className="flex items-center gap-2 mt-1">
                    <code 
                      className="flex-1 text-xs p-2 rounded border"
                      style={{
                        backgroundColor: 'var(--logviewer-bg-primary)',
                        color: 'var(--logviewer-text-primary)',
                        borderColor: 'var(--logviewer-border-primary)'
                      }}
                    >
                      {ollamaCommands[0]}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(ollamaCommands[0])}
                      style={{ color: 'var(--logviewer-text-secondary)' }}
                    >
                      {copiedCommand === ollamaCommands[0] ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-sm" style={{ color: 'var(--logviewer-text-primary)' }}>2. Start Ollama Server</label>
                  <div className="flex items-center gap-2 mt-1">
                    <code 
                      className="flex-1 text-xs p-2 rounded border"
                      style={{
                        backgroundColor: 'var(--logviewer-bg-primary)',
                        color: 'var(--logviewer-text-primary)',
                        borderColor: 'var(--logviewer-border-primary)'
                      }}
                    >
                      {ollamaCommands[1]}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(ollamaCommands[1])}
                      style={{ color: 'var(--logviewer-text-secondary)' }}
                    >
                      {copiedCommand === ollamaCommands[1] ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-sm" style={{ color: 'var(--logviewer-text-primary)' }}>3. Download Model</label>
                  <div className="flex items-center gap-2 mt-1">
                    <code 
                      className="flex-1 text-xs p-2 rounded border"
                      style={{
                        backgroundColor: 'var(--logviewer-bg-primary)',
                        color: 'var(--logviewer-text-primary)',
                        borderColor: 'var(--logviewer-border-primary)'
                      }}
                    >
                      {ollamaCommands[2]}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(ollamaCommands[2])}
                      style={{ color: 'var(--logviewer-text-secondary)' }}
                    >
                      {copiedCommand === ollamaCommands[2] ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </div>

              <div className={`border rounded p-3`} style={{
                backgroundColor: ollamaStatus === 'connected' 
                  ? 'var(--logviewer-debug-bg)' 
                  : 'var(--logviewer-info-bg)',
                borderColor: ollamaStatus === 'connected'
                  ? 'var(--logviewer-debug-border)'
                  : 'var(--logviewer-info-border)'
              }}>
                <p className={`text-xs`} style={{
                  color: ollamaStatus === 'connected' 
                    ? 'var(--logviewer-debug-text)' 
                    : 'var(--logviewer-info-text)'
                }}>
                  <strong>Status:</strong> {ollamaStatus === 'connected' 
                    ? 'Ollama is running and ready for AI analysis.' 
                    : 'The AI incident explainer will automatically use Ollama when available. If not detected, it falls back to heuristic analysis.'}
                </p>
              </div>
            </CardContent>
          </Card>

          <div style={{ borderTop: `1px solid var(--logviewer-border-primary)` }} />

          {/* History Retention Settings Section */}
          <Card 
            className="border"
            style={{
              backgroundColor: 'var(--logviewer-bg-secondary)',
              borderColor: 'var(--logviewer-border-primary)'
            }}
          >
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2" style={{ color: 'var(--logviewer-text-primary)' }}>
                <Clock className="w-4 h-4" />
                History Retention
              </CardTitle>
              <CardDescription style={{ color: 'var(--logviewer-text-secondary)' }}>
                Configure how long to keep pasted log history
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="retention-days" className="text-sm" style={{ color: 'var(--logviewer-text-primary)' }}>
                  Retention Period (days)
                </label>
                <Input
                  id="retention-days"
                  type="number"
                  min="1"
                  max="365"
                  value={retentionDays}
                  onChange={(e) => setRetentionDays(parseInt(e.target.value) || 7)}
                  className="mt-1 border"
                  style={{
                    backgroundColor: 'var(--logviewer-bg-primary)',
                    borderColor: 'var(--logviewer-border-primary)',
                    color: 'var(--logviewer-text-primary)'
                  }}
                />
                <p className="text-xs mt-1" style={{ color: 'var(--logviewer-text-tertiary)' }}>
                  Pasted logs will be automatically deleted after this many days
                </p>
              </div>

              <Button 
                onClick={saveSettings}
                className="w-full"
                style={{
                  backgroundColor: 'var(--logviewer-accent-primary)',
                  color: 'var(--logviewer-text-inverse)'
                }}
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
