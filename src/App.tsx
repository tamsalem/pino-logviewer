import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { LogDisplay, WelcomeScreen, HistoryScreen, Layout } from './components';
import { LogEntry } from './types';
import { parseLogText } from './utils';
import './App.css'

export default function LogViewerPage() {
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [fileName, setFileName] = useState('');
  const [currentScreen, setCurrentScreen] = useState<'welcome' | 'display' | 'history'>('welcome');

  useEffect(() => {
    window.electronAPI.onFileOpened(({ path, content }) => {
      setLogEntries(parseLogText(content));
      setFileName(path);
    });
  }, [window.electronAPI.onFileOpened]);

  const handleFileUpload = useCallback(({ entries, name }: { entries: LogEntry[], name:string }) => {
    if (!entries || !Array.isArray(entries)) {
      console.error('Invalid entries data received:', entries);
      return;
    }
    setLogEntries(entries);
    setFileName(name);
    setCurrentScreen('display');
  }, []);

  const handleClear = useCallback(() => {
    setLogEntries([]);
    setFileName('');
    setCurrentScreen('welcome');
  }, []);

  const handleShowHistory = useCallback(() => {
    setCurrentScreen('history');
  }, []);

  const handleBackFromHistory = useCallback(() => {
    setCurrentScreen('welcome');
  }, []);

  const handleLoadHistory = useCallback((logs: LogEntry[], name: string) => {
    handleFileUpload({ entries: logs, name });
  }, [handleFileUpload]);

  return (
    <Layout onFileUpload={handleFileUpload} onShowHistory={handleShowHistory}>
      <div className="flex flex-col" style={{ height: '100%', backgroundColor: 'var(--logviewer-bg-primary)' }}>
        <AnimatePresence mode="wait">
          {currentScreen === 'history' ? (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              transition={{ duration: 0.3 }}
              className="flex-grow min-h-0"
            >
              <HistoryScreen 
                onBack={handleBackFromHistory}
                onLoadHistory={handleLoadHistory}
              />
            </motion.div>
          ) : logEntries.length === 0 ? (
            <motion.div
              key="uploader"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="flex-grow overflow-auto"
            >
              <WelcomeScreen onFileUpload={handleFileUpload} />
            </motion.div>
          ) : (
            <motion.div
              key="display"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="flex-grow min-h-0"
            >
              <LogDisplay
                entries={logEntries}
                fileName={fileName}
                onClear={handleClear}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}