import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import LogListView from '../LogListView';
import LogToolbar from '../LogToolbar';
import LogDashboard from '../Dashboard';
import { startOfDay, endOfDay } from 'date-fns';
import { type LogEntry } from '../../type/logs';

export default function LogDisplay({ entries, fileName, onClear }: { entries: LogEntry[], fileName: string, onClear: (_:any) => void }) {
  const [selectedLogId, setSelectedLogId] = useState<number | null>(null);
  const [filterLevels, setFilterLevels] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [timeRange, setTimeRange] = useState<{start?: Date; end?: Date}>({});
  const [sortOrder, setSortOrder] = useState('asc'); // 'desc' or 'asc'
  const [isDashboardVisible, setIsDashboardVisible] = useState(false);
  const scrollContainerRef = useRef(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  
  const filteredEntries = useMemo(() => {
    let filtered = [...entries];

    // Level filter
    if (filterLevels.length > 0) {
      filtered = filtered.filter(entry => filterLevels.includes(entry.level as string));
    }

    // Search filter
    if (searchQuery) {
      try {
        const regex = new RegExp(searchQuery, 'i');
        filtered = filtered.filter(entry => regex.test(entry.raw));
      } catch {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(entry => entry.raw.toLowerCase().includes(query));
      }
    }

    // Time range filter
    if (timeRange.start || timeRange.end) {
      const start = timeRange.start ? startOfDay(timeRange.start).getTime() : null;
      const end = timeRange.end ? endOfDay(timeRange.end).getTime() : null;
      
      filtered = filtered.filter(entry => {
        const entryTime = new Date(entry.timestamp).getTime();
        if (start && entryTime < start) return false;
        if (end && entryTime > end) return false;
        return true;
      });
    }

    // Sorting
    filtered.sort((a, b) => {
      const aTime = new Date(a.timestamp).getTime()
      const bTime = new Date(b.timestamp).getTime()
      return sortOrder === 'asc' ? aTime - bTime : bTime - aTime;
    });

    return filtered;
  }, [entries, filterLevels, searchQuery, timeRange, sortOrder]);

  const searchPattern = useMemo(() => {
    if (!searchQuery) return null as RegExp | null;
    try {
      return new RegExp(searchQuery, 'gi');
    } catch {
      const escaped = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(escaped, 'gi');
    }
  }, [searchQuery]);

  const handleSelectLog = useCallback((logId: number) => {
    setSelectedLogId(selectedLogId === logId ? null : logId);
  }, [selectedLogId]);

  const handleToggleDashboard = useCallback(() => {
    setIsDashboardVisible(!isDashboardVisible);
  }, [isDashboardVisible]);

  const handleKeyNavigation = useCallback((direction:string) => {
    if (filteredEntries.length === 0) return;

    const currentIndex = filteredEntries.findIndex(entry => entry.id === selectedLogId);
    let newIndex;

    if (direction === 'up') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : 0;
    } else {
      newIndex = currentIndex < filteredEntries.length - 1 ? currentIndex + 1 : filteredEntries.length -1;
    }

    if (newIndex !== -1) {
        setSelectedLogId(filteredEntries[newIndex].id);
    }
  }, [filteredEntries, selectedLogId]);

  // Global shortcuts: Cmd/Ctrl+F focuses search; PageUp/PageDown scrolls to top/bottom
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes('MAC');
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;
      if (cmdOrCtrl && (e.key === 'f' || e.key === 'F')) {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select?.();
        return;
      }
      if (e.key === 'PageUp') {
        e.preventDefault();
        const el: any = scrollContainerRef.current;
        if (el) el.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      if (e.key === 'PageDown') {
        e.preventDefault();
        const el: any = scrollContainerRef.current;
        if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
        return;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="h-full flex flex-col bg-gray-900">
      <LogToolbar
        fileName={fileName}
        onClear={onClear}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterLevels={filterLevels}
        setFilterLevels={setFilterLevels}
        totalCount={entries.length}
        filteredCount={filteredEntries.length}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        timeRange={timeRange}
        setTimeRange={setTimeRange}
        onToggleDashboard={handleToggleDashboard}
        isDashboardVisible={isDashboardVisible}
        searchInputRef={searchInputRef}
      />
      {isDashboardVisible && <LogDashboard entries={filteredEntries} />}
      <div className="flex-grow min-h-0 bg-gray-900">
        <LogListView
          entries={filteredEntries}
          selectedLogId={selectedLogId}
          onSelectLog={handleSelectLog}
          onKeyNavigation={handleKeyNavigation}
          scrollContainerRef={scrollContainerRef}
          isCompactView={false}
          searchPattern={searchPattern}
        />
      </div>
    </div>
  );
}