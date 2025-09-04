import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import LogDisplay from './components/LogDisplay';
import WelcomeScreen from './components/WelcomeScreen';
import Layout from './components/Layout';
import { LogEntry } from './type/logs';
import { parseLogText } from './Utils';
import './App.css'

export default function LogViewerPage() {
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [fileName, setFileName] = useState('');

  useEffect(() => {
    window.electronAPI.onFileOpened(({ path, content }) => {
      setLogEntries(parseLogText(content));
      setFileName(path);
    });
  }, [window.electronAPI.onFileOpened]);

  const handleFileUpload = useCallback(({ entries, name }: { entries: LogEntry[], name:string }) => {
    setLogEntries(entries);
    setFileName(name);
  }, []);

  const handleClear = useCallback(() => {
    setLogEntries([]);
    setFileName('');
  }, []);

  return (
    <Layout>
      <div className="flex flex-col bg-gray-900" style={{ height: '100%' }}>
        <AnimatePresence mode="wait">
          {logEntries.length === 0 ? (
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