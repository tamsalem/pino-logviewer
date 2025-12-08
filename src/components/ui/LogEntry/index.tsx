import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, Copy, ExternalLink, Bookmark } from 'lucide-react';
import { Button } from '../../../../components/ui';
import { LogLevel, type LogEntry as LogEntryType } from '../../../types';

// Consistent level colors using CSS variables
const getLevelStyles = (level: string) => {
  switch (level) {
    case 'ERROR':
      return {
        bg: 'var(--logviewer-error-bg)',
        text: 'var(--logviewer-error-text)',
        border: 'var(--logviewer-error-border)'
      };
    case 'WARN':
      return {
        bg: 'var(--logviewer-warn-bg)',
        text: 'var(--logviewer-warn-text)',
        border: 'var(--logviewer-warn-border)'
      };
    case 'INFO':
      return {
        bg: 'var(--logviewer-info-bg)',
        text: 'var(--logviewer-info-text)',
        border: 'var(--logviewer-info-border)'
      };
    case 'DEBUG':
      return {
        bg: 'var(--logviewer-debug-bg)',
        text: 'var(--logviewer-debug-text)',
        border: 'var(--logviewer-debug-border)'
      };
    default:
      return {
        bg: 'var(--logviewer-no-level-bg)',
        text: 'var(--logviewer-no-level-text)',
        border: 'var(--logviewer-no-level-border)'
      };
  }
};

const JsonViewer = ({ data, searchPattern }: { data: unknown, searchPattern: RegExp | null }) => {
  const renderValue = (key:number | string | null, value:unknown, level = 0) => {
    const indent = '  '.repeat(Math.max(0, level));
    
    if (value === null) {
      return <span style={{ color: 'var(--logviewer-code-null)' }}>null</span>;
    }
    if (typeof value === 'string') {
      return <span style={{ color: 'var(--logviewer-code-string)' }}>"{highlightText(value, searchPattern)}"</span>;
    }
    if (typeof value === 'number') {
      return <span style={{ color: 'var(--logviewer-code-number)' }}>{value}</span>;
    }
    if (typeof value === 'boolean') {
      return <span style={{ color: 'var(--logviewer-code-boolean)' }}>{value.toString()}</span>;
    }
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <span style={{ color: 'var(--logviewer-code-bracket)' }}>[]</span>;
      }
      return (
        <>
          <span style={{ color: 'var(--logviewer-code-bracket)' }}>[</span>
          <div className="pl-4">
            {value.map((item, index) => (
              <div key={index}>
                {renderValue(index, item, level + 1)}
                {index < value.length - 1 && <span style={{ color: 'var(--logviewer-code-bracket)' }}>,</span>}
              </div>
            ))}
          </div>
          <div>{indent}<span style={{ color: 'var(--logviewer-code-bracket)' }}>]</span></div>
        </>
      );
    }
    if (typeof value === 'object') {
      const entries = Object.entries(value);
      if (entries.length === 0) {
        return <span style={{ color: 'var(--logviewer-code-bracket)' }}>{'{}'}</span>;
      }
      return (
        <>
          <span style={{ color: 'var(--logviewer-code-bracket)' }}>{'{'}</span>
          <div className="pl-4">
            {entries.map(([k, v], index) => (
              <div key={k}>
                <span style={{ color: 'var(--logviewer-code-key)' }}>"{highlightText(String(k), searchPattern)}"</span>
                <span style={{ color: 'var(--logviewer-code-bracket)' }}>: </span>
                {renderValue(k, v, level + 1)}
                {index < entries.length - 1 && <span style={{ color: 'var(--logviewer-code-bracket)' }}>,</span>}
              </div>
            ))}
          </div>
          <div>{indent}<span style={{ color: 'var(--logviewer-code-bracket)' }}>{'}'}</span></div>
        </>
      );
    }
    return <span style={{ color: 'var(--logviewer-text-primary)' }}>{String(value)}</span>;
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
      <mark 
        key={`${start}-${end}`} 
        className="rounded px-0.5"
        style={{ 
          backgroundColor: 'var(--logviewer-highlight-bg)', 
          color: 'var(--logviewer-highlight-text)' 
        }}
      >
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

export default React.memo(function LogEntry({ entry, isSelected, isExpanded, onClick, isCompactView, searchPattern, hasSearchMatch, isCurrentSearchResult, isBookmarked, onToggleBookmark }:
    { entry: LogEntryType, isSelected: boolean, isExpanded: boolean, onClick: (_:any) => void, isCompactView: boolean, searchPattern: RegExp | null, hasSearchMatch?: boolean, isCurrentSearchResult?: boolean, isBookmarked?: boolean, onToggleBookmark?: (logId: number) => void }) {
  const levelName = entry.level || 'NO_LEVEL';
  const levelStyles = getLevelStyles(levelName);

  // Determine background color based on search state
  const getBackgroundStyle = () => {
    if (isCurrentSearchResult) {
      return {
        backgroundColor: 'var(--logviewer-highlight-current)',
        borderLeftColor: 'var(--logviewer-highlight-current)'
      };
    } else if (hasSearchMatch) {
      return {
        backgroundColor: 'var(--logviewer-highlight-bg)',
        borderLeftColor: 'var(--logviewer-highlight-bg)'
      };
    } else if (isSelected) {
      return {
        backgroundColor: levelStyles.bg,
        borderLeftColor: levelStyles.border
      };
    } else {
      return {
        backgroundColor: 'transparent',
        borderLeftColor: 'transparent'
      };
    }
  };

  return (
    <div
      data-log-id={entry.id}
      className="border-l-4 transition-all duration-200"
      style={getBackgroundStyle()}
      onMouseEnter={(e) => {
        if (!isSelected && !hasSearchMatch && !isCurrentSearchResult) {
          e.currentTarget.style.backgroundColor = 'var(--logviewer-bg-hover)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected && !hasSearchMatch && !isCurrentSearchResult) {
          e.currentTarget.style.backgroundColor = 'transparent';
        }
      }}
    >
      <div className={`flex items-center px-4 select-none ${isCompactView ? 'py-1' : 'py-2'}`}>
        <div className="flex items-center mr-3 cursor-pointer" style={{ color: 'var(--logviewer-text-secondary)' }} onClick={onClick}>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </div>
        
        <div className="flex items-center gap-4 flex-grow min-w-0 cursor-pointer" onClick={onClick}>
          <span 
            className="px-2 py-1 text-xs font-bold rounded flex-shrink-0"
            style={{
              backgroundColor: levelStyles.bg,
              color: levelStyles.text
            }}
          >
            {levelName}
          </span>
          
          <span 
            className={`font-mono flex-shrink-0 ${isCompactView ? 'text-xs' : 'text-sm'}`}
            style={{ color: 'var(--logviewer-text-secondary)' }}
          >
            {formatTime(entry.timestamp, isCompactView)}
          </span>
          
          <span
            className={`flex-grow truncate font-mono ${isCompactView ? 'text-xs' : 'text-sm'}`}
            style={{ color: 'var(--logviewer-text-primary)' }}
          >
            {highlightText(entry.message || 'No message', searchPattern)}
          </span>
        </div>
        
        {/* Bookmark Button */}
        {onToggleBookmark && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onToggleBookmark(entry.id);
            }}
            className="ml-2"
            style={{
              color: isBookmarked ? 'var(--logviewer-accent-primary)' : 'var(--logviewer-text-secondary)',
            }}
          >
            <Bookmark className="w-4 h-4" fill={isBookmarked ? 'currentColor' : 'none'} />
          </Button>
        )}
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
              <div 
                className="rounded-lg p-4 border"
                style={{
                  backgroundColor: 'var(--logviewer-bg-secondary)',
                  borderColor: 'var(--logviewer-border-primary)'
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium" style={{ color: 'var(--logviewer-text-primary)' }}>Log Details</h4>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyToClipboard(entry.raw)}
                      style={{ color: 'var(--logviewer-text-secondary)' }}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyToClipboard(JSON.stringify(entry.data, null, 2))}
                      style={{ color: 'var(--logviewer-text-secondary)' }}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div 
                  className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-4 pb-4 border-b"
                  style={{ borderColor: 'var(--logviewer-border-primary)' }}
                >
                  <div>
                    <span style={{ color: 'var(--logviewer-text-secondary)' }}>Timestamp:</span>
                    <div className="font-mono mt-1" style={{ color: 'var(--logviewer-text-primary)' }}>
                      {formatTime(entry.timestamp, false)}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--logviewer-text-secondary)' }}>Level:</span>
                    <div className="font-mono mt-1">
                      <span 
                        className="px-2 py-1 text-xs font-bold rounded flex-shrink-0"
                        style={{
                          backgroundColor: levelStyles.bg,
                          color: levelStyles.text
                        }}
                      >
                        {levelName}
                      </span>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <span style={{ color: 'var(--logviewer-text-secondary)' }}>Message:</span>
                    <div className="font-mono mt-1 break-words" style={{ color: 'var(--logviewer-text-primary)' }}>
                      {highlightText(entry.message || 'No message', searchPattern)}
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2" style={{ color: 'var(--logviewer-text-secondary)' }}>Raw Data:</h4>
                  <div 
                    className="rounded-md p-3 overflow-x-auto"
                    style={{ backgroundColor: 'var(--logviewer-bg-primary)' }}
                  >
                    {entry.isJson ? (
                      <JsonViewer data={entry.data} searchPattern={searchPattern} />
                    ) : (
                      <pre className="font-mono text-sm whitespace-pre-wrap" style={{ color: 'var(--logviewer-text-primary)' }}>
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