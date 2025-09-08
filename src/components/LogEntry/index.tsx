import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, Copy, ExternalLink } from 'lucide-react';
import { Button } from '../../../components/ui';
import { LogLevel, type LogEntry as LogEntryType } from '../../type/logs';

const levelColors = {
  [LogLevel.ERROR]: 'bg-red-500/10 text-red-300 border-l-red-500', // error
  [LogLevel.WARN]: 'bg-yellow-500/10 text-yellow-300 border-l-yellow-500', // warn
  [LogLevel.INFO]: 'bg-blue-500/10 text-blue-300 border-l-blue-500', // info
  [LogLevel.DEBUG]: 'bg-green-500/10 text-green-300 border-l-green-500', // debug
};

const JsonViewer = ({ data, searchPattern }: { data: unknown, searchPattern: RegExp | null }) => {
  const renderValue = (key:number | string | null, value:unknown, level = 0) => {
    const indent = '  '.repeat(Math.max(0, level));
    
    if (value === null) {
      return <span className="text-purple-400">null</span>;
    }
    if (typeof value === 'string') {
      return <span className="text-green-400">"{highlightText(value, searchPattern)}"</span>;
    }
    if (typeof value === 'number') {
      return <span className="text-orange-400">{value}</span>;
    }
    if (typeof value === 'boolean') {
      return <span className="text-purple-400">{value.toString()}</span>;
    }
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <span className="text-gray-400">[]</span>;
      }
      return (
        <>
          <span className="text-gray-400">[</span>
          <div className="pl-4">
            {value.map((item, index) => (
              <div key={index}>
                {renderValue(index, item, level + 1)}
                {index < value.length - 1 && <span className="text-gray-400">,</span>}
              </div>
            ))}
          </div>
          <div>{indent}<span className="text-gray-400">]</span></div>
        </>
      );
    }
    if (typeof value === 'object') {
      const entries = Object.entries(value);
      if (entries.length === 0) {
        return <span className="text-gray-400">{'{}'}</span>;
      }
      return (
        <>
          <span className="text-gray-400">{'{'}</span>
          <div className="pl-4">
            {entries.map(([k, v], index) => (
              <div key={k}>
                <span className="text-blue-400">"{highlightText(String(k), searchPattern)}"</span>
                <span className="text-gray-400">: </span>
                {renderValue(k, v, level + 1)}
                {index < entries.length - 1 && <span className="text-gray-400">,</span>}
              </div>
            ))}
          </div>
          <div>{indent}<span className="text-gray-400">{'}'}</span></div>
        </>
      );
    }
    return <span className="text-gray-300">{String(value)}</span>;
  };

  return <pre className="font-mono text-sm leading-relaxed overflow-x-auto">{renderValue(null, data, 0)}</pre>;
};

const formatTime = (timestamp:string, isCompactView: boolean) => {
    const date = new Date(timestamp);
    return isCompactView 
      ? date.toLocaleTimeString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit', hour12: false, hour: '2-digit', minute: '2-digit' })
      : date.toLocaleTimeString('he-IL', {
          hour12: false,
          day: '2-digit',
          month: '2-digit',
          year: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          fractionalSecondDigits: 3
        });
  };

const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // Could add a toast notification here
    });
};

const highlightText = (text: string, pattern: RegExp | null) => {
  if (!pattern || !text) return text;
  const segments: React.ReactNode[] = [];
  let lastIndex = 0;
  pattern.lastIndex = 0;
  let match;
  while ((match = pattern.exec(text)) !== null) {
    const start = match.index;
    const end = start + match[0].length;
    if (start > lastIndex) {
      segments.push(text.slice(lastIndex, start));
    }
    segments.push(
      <mark key={`${start}-${end}`} className="bg-yellow-500/60 text-gray-900 rounded px-0.5">
        {text.slice(start, end)}
      </mark>
    );
    lastIndex = end;
    if (pattern.lastIndex === start) pattern.lastIndex++; // avoid zero-length loops
  }
  if (lastIndex < text.length) {
    segments.push(text.slice(lastIndex));
  }
  return <>{segments}</>;
};

export default React.memo(function LogEntry({ entry, isSelected, isExpanded, onClick, isCompactView, searchPattern }: 
    { entry: LogEntryType, isSelected: boolean, isExpanded: boolean, onClick: (_:any) => void, isCompactView: boolean, searchPattern: RegExp | null }) {
  const levelName = entry.level || LogLevel.INFO;
  const levelColor = levelColors[levelName];

  return (
    <div
      data-log-id={entry.id}
      className={`border-l-4 transition-all duration-200 ${
        isSelected 
          ? `${levelColor} bg-gray-800/50` 
          : 'border-l-transparent hover:bg-gray-800/30'
      }`}
    >
      <div className={`flex items-center px-4 cursor-pointer select-none ${isCompactView ? 'py-1' : 'py-2'}`} onClick={onClick}>
        <div className="flex items-center mr-3 text-gray-500">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </div>
        
        <div className="flex items-center gap-4 flex-grow min-w-0">
          <span className={`px-2 py-1 text-xs font-bold rounded flex-shrink-0 ${
            entry.level === LogLevel.ERROR ? 'bg-red-500/20 text-red-300' :
            entry.level === LogLevel.WARN ? 'bg-yellow-500/20 text-yellow-300' :
            entry.level === LogLevel.INFO ? 'bg-blue-500/20 text-blue-300' :
            'bg-gray-500/20 text-gray-400'
          }`}>
            {levelName}
          </span>
          
          <span className={`text-gray-400 font-mono flex-shrink-0 ${isCompactView ? 'text-xs' : 'text-sm'}`}>
            {formatTime(entry.timestamp, isCompactView)}
          </span>
          
          <span className={`text-gray-200 flex-grow truncate font-mono ${isCompactView ? 'text-xs' : 'text-sm'}`}>
            {highlightText(entry.message || 'No message', searchPattern)}
          </span>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 ml-7">
              <div className="bg-gray-900/80 rounded-lg p-4 border border-gray-700/50">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-gray-300 font-medium">Log Details</h4>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyToClipboard(entry.raw)}
                      className="text-gray-400 hover:text-white"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyToClipboard(JSON.stringify(entry.data, null, 2))}
                      className="text-gray-400 hover:text-white"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-4 pb-4 border-b border-gray-700">
                  <div>
                    <span className="text-gray-500">Timestamp:</span>
                    <div className="font-mono text-gray-300 mt-1">
                      {formatTime(entry.timestamp, false)}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Level:</span>
                    <div className="font-mono text-gray-300 mt-1">
                      <span className={`px-2 py-1 text-xs font-bold rounded flex-shrink-0 ${
                        entry.level === LogLevel.ERROR ? 'bg-red-500/20 text-red-300' :
                        entry.level === LogLevel.WARN ? 'bg-yellow-500/20 text-yellow-300' :
                        entry.level === LogLevel.INFO ? 'bg-blue-500/20 text-blue-300' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {levelName}
                      </span>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">Message:</span>
                    <div className="font-mono text-gray-300 mt-1 break-words">
                      {highlightText(entry.message || 'No message', searchPattern)}
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-gray-400 font-medium mb-2">Raw Data:</h4>
                  <div className="bg-gray-950 rounded-md p-3 overflow-x-auto">
                    {entry.isJson ? (
                      <JsonViewer data={entry.data} searchPattern={searchPattern} />
                    ) : (
                      <pre className="font-mono text-sm text-gray-300 whitespace-pre-wrap">
                        {highlightText(entry.raw, searchPattern)}
                      </pre>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});