import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { LogListView, LogToolbar } from '../../ui';
import { LogDashboard, IncidentDrawer, Fireworks } from '../';
import { analyzeIncident, summarizeIncidentWithOllama, type IncidentAnalysis } from '../../../services';
import { startOfDay, endOfDay } from 'date-fns';
import { type LogEntry } from '../../../types';
import { DEFAULT_FILTER_LEVELS, LLM_PROVIDERS, API_ENDPOINTS, SEARCH_DEBOUNCE_DELAY } from '../../../constants';

export default function LogDisplay({ entries, fileName, onClear }: { entries: LogEntry[], fileName: string, onClear: (_:any) => void }) {
  const [selectedLogId, setSelectedLogId] = useState<number | null>(null);
  const [filterLevels, setFilterLevels] = useState<string[]>(DEFAULT_FILTER_LEVELS);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState<'highlight' | 'filter'>('highlight');
  const [timeRange, setTimeRange] = useState<{start?: Date; end?: Date}>({});
  const [sortOrder, setSortOrder] = useState('asc'); // 'desc' or 'asc'
  const [bookmarkedLogIds, setBookmarkedLogIds] = useState<Set<number>>(new Set());
  const [currentBookmarkIndex, setCurrentBookmarkIndex] = useState(0);
  const [isDashboardVisible, setIsDashboardVisible] = useState(false);
  const [isIncidentOpen, setIsIncidentOpen] = useState(false);
  const [incident, setIncident] = useState<IncidentAnalysis | null>(null);
  const [llmAvailable, setLlmAvailable] = useState<'none' | 'ollama'>(LLM_PROVIDERS.NONE);
  const [llmLoading, setLlmLoading] = useState(false);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [showFireworks, setShowFireworks] = useState(false);
  const lastSummarizedFileRef = useRef<string | null>(null);
  const scrollContainerRef = useRef(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  
  const filteredEntries = useMemo(() => {
    let filtered = [...entries];

    // Level filter - only show logs with selected levels
    // If no levels are selected, show no logs
    filtered = filtered.filter(entry => {
      const entryLevel = entry.level || 'NO_LEVEL';
      return filterLevels.includes(entryLevel);
    });

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

    // Search filter - only apply when in filter mode
    if (searchQuery && searchMode === 'filter') {
      try {
        const regex = new RegExp(searchQuery, 'gi');
        filtered = filtered.filter(entry => regex.test(entry.raw));
      } catch {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(entry => entry.raw.toLowerCase().includes(query));
      }
    }

    // Sorting
    filtered.sort((a, b) => {
      const aTime = new Date(a.timestamp).getTime()
      const bTime = new Date(b.timestamp).getTime()
      return sortOrder === 'asc' ? aTime - bTime : bTime - aTime;
    });

    return filtered;
  }, [entries, filterLevels, timeRange, sortOrder, searchQuery, searchMode]);

  // Find search results and track their positions (only for highlight mode)
  const searchResults = useMemo(() => {
    if (!searchQuery || searchMode === 'filter') return [];
    
    const results: { entryId: number; index: number }[] = [];
    let globalIndex = 0;
    
    filteredEntries.forEach((entry, entryIndex) => {
      try {
        const regex = new RegExp(searchQuery, 'gi');
        if (regex.test(entry.raw)) {
          results.push({ entryId: entry.id, index: globalIndex });
        }
      } catch {
        const query = searchQuery.toLowerCase();
        if (entry.raw.toLowerCase().includes(query)) {
          results.push({ entryId: entry.id, index: globalIndex });
        }
      }
      globalIndex++;
    });
    
    return results;
  }, [filteredEntries, searchQuery]);

  // Reset search index when search query changes and check for easter egg
  useEffect(() => {
    setCurrentSearchIndex(0);
    
    // Easter egg: show fireworks when searching for "tal"
    if (searchQuery.toLowerCase() === 'tal') {
      setShowFireworks(true);
      const timer = setTimeout(() => {
        setShowFireworks(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [searchQuery]);

  const searchPattern = useMemo(() => {
    if (!searchQuery || searchMode === 'filter') return null as RegExp | null;
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

  // Search navigation functions
  const navigateToNextSearch = useCallback(() => {
    if (searchResults.length === 0) return;
    const nextIndex = (currentSearchIndex + 1) % searchResults.length;
    setCurrentSearchIndex(nextIndex);
    const targetEntry = searchResults[nextIndex];
    setSelectedLogId(targetEntry.entryId);
  }, [searchResults, currentSearchIndex]);

  const navigateToPreviousSearch = useCallback(() => {
    if (searchResults.length === 0) return;
    const prevIndex = currentSearchIndex === 0 ? searchResults.length - 1 : currentSearchIndex - 1;
    setCurrentSearchIndex(prevIndex);
    const targetEntry = searchResults[prevIndex];
    setSelectedLogId(targetEntry.entryId);
  }, [searchResults, currentSearchIndex]);

  // Bookmark management
  const toggleBookmark = useCallback((logId: number) => {
    setBookmarkedLogIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(logId)) {
        newSet.delete(logId);
      } else {
        newSet.add(logId);
      }
      return newSet;
    });
  }, []);

  // Get bookmarked entries in order
  const bookmarkedEntries = useMemo(() => {
    return filteredEntries.filter(entry => bookmarkedLogIds.has(entry.id));
  }, [filteredEntries, bookmarkedLogIds]);

  // Navigate to next bookmark
  const navigateToNextBookmark = useCallback(() => {
    if (bookmarkedEntries.length === 0) return;
    const nextIndex = (currentBookmarkIndex + 1) % bookmarkedEntries.length;
    setCurrentBookmarkIndex(nextIndex);
    setSelectedLogId(bookmarkedEntries[nextIndex].id);
  }, [bookmarkedEntries, currentBookmarkIndex]);

  // Navigate to previous bookmark
  const navigateToPreviousBookmark = useCallback(() => {
    if (bookmarkedEntries.length === 0) return;
    const prevIndex = currentBookmarkIndex === 0 ? bookmarkedEntries.length - 1 : currentBookmarkIndex - 1;
    setCurrentBookmarkIndex(prevIndex);
    setSelectedLogId(bookmarkedEntries[prevIndex].id);
  }, [bookmarkedEntries, currentBookmarkIndex]);

  // Reset bookmark index when bookmarks change
  useEffect(() => {
    if (bookmarkedEntries.length > 0 && currentBookmarkIndex >= bookmarkedEntries.length) {
      setCurrentBookmarkIndex(0);
    }
  }, [bookmarkedEntries.length, currentBookmarkIndex]);

  // Global shortcuts: Cmd/Ctrl+F focuses search; F3/Shift+F3 for search navigation; Enter for next search; PageUp/PageDown scrolls to top/bottom
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
      
      if (e.key === 'F3') {
        e.preventDefault();
        if (e.shiftKey) {
          navigateToPreviousSearch();
        } else {
          navigateToNextSearch();
        }
        return;
      }
      
      // Enter key moves to next search result (works globally when there's an active search)
      if (e.key === 'Enter' && searchQuery && searchResults.length > 0) {
        e.preventDefault();
        navigateToNextSearch();
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
  }, [navigateToNextSearch, navigateToPreviousSearch, searchQuery, searchResults]);

  // Check LLM availability (Ollama only)
  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('http://localhost:11434/api/tags')
        setLlmAvailable(res.ok ? LLM_PROVIDERS.OLLAMA : LLM_PROVIDERS.NONE)
      } catch {
        setLlmAvailable(LLM_PROVIDERS.NONE)
      }
    })()
  }, [])

  const handleExplainIncident = useCallback(() => {
    // run on current filteredEntries
    const analysis = analyzeIncident(filteredEntries as any);
    setIncident(analysis);
    setIsIncidentOpen(true);
    // Try upgrading with LLM if configured
    void (async () => {
      // Skip if already summarized for this exact file
      if (fileName && lastSummarizedFileRef.current === fileName && incident?.llmSummary) {
        return;
      }
      setLlmLoading(true);
      try {
        const llm = await summarizeIncidentWithOllama(analysis);
        if (llm) {
          setIncident(prev => prev ? { ...prev, llmSummary: llm } : prev);
          if (fileName) lastSummarizedFileRef.current = fileName;
        }
      } finally {
        setLlmLoading(false);
      }
    })();
  }, [filteredEntries, fileName, incident]);

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: 'var(--logviewer-bg-primary)' }}>
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
        onExplainIncident={handleExplainIncident}
        llmAvailable={llmAvailable}
        allLogs={entries}
        filteredLogs={filteredEntries}
        searchResults={searchResults}
        currentSearchIndex={currentSearchIndex}
        onNavigateToNextSearch={navigateToNextSearch}
        onNavigateToPreviousSearch={navigateToPreviousSearch}
        searchMode={searchMode}
        setSearchMode={setSearchMode}
        bookmarkedCount={bookmarkedLogIds.size}
        currentBookmarkIndex={currentBookmarkIndex}
        onNavigateToNextBookmark={navigateToNextBookmark}
        onNavigateToPreviousBookmark={navigateToPreviousBookmark}
      />
      {isDashboardVisible && <LogDashboard entries={filteredEntries} />}
      <div className="flex-grow min-h-0" style={{ backgroundColor: 'var(--logviewer-bg-primary)' }}>
        <LogListView
          entries={filteredEntries}
          selectedLogId={selectedLogId}
          onSelectLog={handleSelectLog}
          onKeyNavigation={handleKeyNavigation}
          scrollContainerRef={scrollContainerRef}
          isCompactView={false}
          searchPattern={searchPattern}
          searchResults={searchResults}
          currentSearchIndex={currentSearchIndex}
          bookmarkedLogIds={bookmarkedLogIds}
          onToggleBookmark={toggleBookmark}
        />
      </div>
      <IncidentDrawer open={isIncidentOpen} onClose={() => setIsIncidentOpen(false)} analysis={incident} llmAvailable={llmAvailable} llmLoading={llmLoading} />
      {showFireworks && <Fireworks duration={4000} />}
    </div>
  );
}