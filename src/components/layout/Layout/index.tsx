import { Logs, Settings, History, Sun, Moon } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { useState } from 'react';
import SettingsSidebar from '../SettingsSidebar';
import { useTheme } from '../../../contexts/ThemeContext';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@radix-ui/react-tooltip';

export default function Layout({ children, onFileUpload, onShowHistory }: { 
  children: any, 
  onFileUpload?: (data: { entries: any[], name: string }) => void,
  onShowHistory?: () => void 
}) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="h-screen font-sans flex flex-col" style={{
      backgroundColor: 'var(--logviewer-bg-primary)',
      color: 'var(--logviewer-text-primary)'
    }}>
      <style>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        ::-webkit-scrollbar {
          width: 8px;
        }
        html, body, #root {
          height: 100%;
          overflow: hidden;
        }
      `}</style>
      <header className="flex-shrink-0" style={{ borderBottom: `1px solid var(--logviewer-border-primary)` }}>
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--logviewer-bg-secondary)' }}>
                <Logs className="h-6 w-6" style={{ color: 'var(--logviewer-accent-primary)' }} />
              </div>
              <h1 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--logviewer-text-primary)' }}>
                Pino Log Viewer
              </h1>
            </div>
            <TooltipProvider delayDuration={500}>
              <div className="flex items-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onShowHistory}
                      className="transition-colors"
                      style={{
                        color: 'var(--logviewer-text-secondary)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--logviewer-bg-hover)';
                        e.currentTarget.style.color = 'var(--logviewer-text-primary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'var(--logviewer-text-secondary)';
                      }}
                    >
                      <History className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent
                    className="px-2 py-1 text-xs rounded"
                    style={{
                      backgroundColor: 'var(--logviewer-bg-elevated)',
                      color: 'var(--logviewer-text-primary)',
                      border: `1px solid var(--logviewer-border-primary)`
                    }}
                  >
                    <p>History</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleTheme}
                      className="transition-colors"
                      style={{
                        color: 'var(--logviewer-text-secondary)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--logviewer-bg-hover)';
                        e.currentTarget.style.color = 'var(--logviewer-text-primary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'var(--logviewer-text-secondary)';
                      }}
                    >
                      {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent
                    className="px-2 py-1 text-xs rounded"
                    style={{
                      backgroundColor: 'var(--logviewer-bg-elevated)',
                      color: 'var(--logviewer-text-primary)',
                      border: `1px solid var(--logviewer-border-primary)`
                    }}
                  >
                    <p>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</p>
                  </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsSettingsOpen(true)}
                      className="transition-colors"
                      style={{
                        color: 'var(--logviewer-text-secondary)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--logviewer-bg-hover)';
                        e.currentTarget.style.color = 'var(--logviewer-text-primary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'var(--logviewer-text-secondary)';
                      }}
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent
                    className="px-2 py-1 text-xs rounded"
                    style={{
                      backgroundColor: 'var(--logviewer-bg-elevated)',
                      color: 'var(--logviewer-text-primary)',
                      border: `1px solid var(--logviewer-border-primary)`
                    }}
                  >
                    <p>Settings</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          </div>
        </div>
      </header>
      <main className="flex-grow min-h-0" style={{ backgroundColor: 'var(--logviewer-bg-primary)' }}>
        {children}
      </main>
      
      <SettingsSidebar 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}