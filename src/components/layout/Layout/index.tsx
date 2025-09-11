import { Logs, Settings, History } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { useState } from 'react';
import SettingsSidebar from '../SettingsSidebar';

export default function Layout({ children, onFileUpload, onShowHistory }: { 
  children: any, 
  onFileUpload?: (data: { entries: any[], name: string }) => void,
  onShowHistory?: () => void 
}) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div className="h-screen bg-gray-900 text-gray-200 font-sans flex flex-col">
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
      <header className="flex-shrink-0 border-b border-gray-700/50">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-gray-800 p-2 rounded-lg">
                <Logs className="h-6 w-6 text-indigo-400" />
              </div>
              <h1 className="text-xl font-semibold tracking-tight text-white">
                Pino Log Viewer
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onShowHistory}
                className="text-gray-400 hover:text-white hover:bg-gray-800 flex items-center gap-2"
              >
                <History className="w-4 h-4" />
                History
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSettingsOpen(true)}
                className="text-gray-400 hover:text-white hover:bg-gray-800 flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-grow min-h-0 bg-gray-900 scrollbar-track-gray-800">
        {children}
      </main>
      
      <SettingsSidebar 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}