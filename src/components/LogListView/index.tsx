import { useEffect, useCallback } from 'react';
import LogEntry from '../LogEntry';
import { type LogEntry as LogEntryType } from '@/src/type/logs';

export default function LogListView({ entries, selectedLogId, onSelectLog, onKeyNavigation, scrollContainerRef, isCompactView, searchPattern, searchResults, currentSearchIndex } :
    { entries: LogEntryType[], selectedLogId: number| null, onSelectLog: (index:number) => void, onKeyNavigation: (_:any) => void, scrollContainerRef: any, isCompactView: boolean, searchPattern: RegExp | null, searchResults?: { entryId: number; index: number }[], currentSearchIndex?: number }
) {
  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: any) => {
      if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        event.preventDefault();
        onKeyNavigation(event.key === 'ArrowUp' ? 'up' : 'down');
      } else if (event.key === 'Enter' || event.key === ' ') {
        if (selectedLogId) {
          event.preventDefault();
          onSelectLog(selectedLogId);
        }
      }
    };

    const container = scrollContainerRef?.current;
    if (container) {
      container.addEventListener('keydown', handleKeyDown);
      container.focus();
    }

    return () => {
      if (container) {
        container.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [selectedLogId, onSelectLog, onKeyNavigation, scrollContainerRef]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedLogId && scrollContainerRef?.current) {
      const selectedElement = scrollContainerRef.current.querySelector(`[data-log-id="${selectedLogId}"]`);
      if (selectedElement) {
        selectedElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }
  }, [selectedLogId, scrollContainerRef]);

  const handleLogClick = useCallback((logId: number) => {
    onSelectLog(logId);
  }, [onSelectLog]);

  if (entries.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 bg-gray-900">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <p className="text-xl">No matching logs found</p>
          <p className="text-sm mt-2">Try adjusting your filters or search query</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={scrollContainerRef}
      className="h-full overflow-auto focus:outline-none bg-gray-900 scroll-smooth"
      tabIndex={0}
    >
      <div className="bg-gray-900">
        {entries.map((entry: LogEntryType) => {
          const hasSearchMatch = searchResults?.some(result => result.entryId === entry.id) || false;
          const isCurrentSearchResult = searchResults?.[currentSearchIndex || 0]?.entryId === entry.id;
          
          return (
            <LogEntry
              key={entry.id}
              entry={entry}
              isSelected={selectedLogId === entry.id}
              isExpanded={selectedLogId === entry.id}
              onClick={() => handleLogClick(entry.id)}
              isCompactView={isCompactView}
              searchPattern={searchPattern}
              hasSearchMatch={hasSearchMatch}
              isCurrentSearchResult={isCurrentSearchResult}
            />
          );
        })}
      </div>
    </div>
  );
}