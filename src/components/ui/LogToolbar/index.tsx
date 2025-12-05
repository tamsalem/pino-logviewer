import { useState, useEffect } from 'react';
import { X, File, Search, Calendar, ArrowDownUp, BarChart3, Circle, Download, ChevronUp, ChevronDown, Check, Filter } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@radix-ui/react-tooltip';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  Input,
  Button,
  Calendar as CalendarComponent,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../../../components/ui';
import { Sparkles } from 'lucide-react';
import { exportToCSV, exportToJSON, getFilteredLogs, type LogEntry, type ExportOptions } from '../../../utils';
import { LOG_LEVEL_OPTIONS, SEARCH_DEBOUNCE_DELAY } from '../../../constants';

export default function LogToolbar(params: {
  fileName: string,
  onClear: (_:any) => void,
  searchQuery?:string,
  setSearchQuery: (_:any) => void,
  filterLevels:string[],
  setFilterLevels: (_:any) => void,
  totalCount:number,
  filteredCount: number,
  sortOrder: string,
  setSortOrder: (_:any) => void,
  timeRange:{ start?: Date; end?: Date }
  setTimeRange: (_:any) => void,
  isDashboardVisible: boolean,
  onToggleDashboard: (_:any) => void,
  searchInputRef?: React.RefObject<HTMLInputElement>,
  onExplainIncident?: () => void,
  llmAvailable?: 'none' | 'ollama',
  allLogs: LogEntry[],
  filteredLogs: LogEntry[],
  searchResults?: { entryId: number; index: number }[],
  currentSearchIndex?: number,
  onNavigateToNextSearch?: () => void,
  onNavigateToPreviousSearch?: () => void,
}) {
  const {
    fileName,
    onClear,
    searchQuery,
    setSearchQuery,
    filterLevels,
    setFilterLevels,
    totalCount,
    filteredCount,
    sortOrder,
    setSortOrder,
    timeRange,
    setTimeRange,
    isDashboardVisible,
    onToggleDashboard,
    searchInputRef,
    onExplainIncident,
    llmAvailable,
    allLogs,
    filteredLogs,
    searchResults = [],
    currentSearchIndex = 0,
    onNavigateToNextSearch,
    onNavigateToPreviousSearch,
  } = params
  const [inputValue, setInputValue] = useState(searchQuery);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [ollamaDialogOpen, setOllamaDialogOpen] = useState(false);
  const [levelFilterOpen, setLevelFilterOpen] = useState(false);

  // Debounce the search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(inputValue);
    }, SEARCH_DEBOUNCE_DELAY);

    return () => {
      clearTimeout(timer);
    };
  }, [inputValue, setSearchQuery]);

  // Sync the input value if the search query is cleared externally
  useEffect(() => {
    if (searchQuery === '') {
      setInputValue('');
    }
  }, [searchQuery]);
  
  const clearAllFilters = () => {
    setSearchQuery('');
    setFilterLevels([]);
    setTimeRange({ start: null, end: null });
  };
  
  const activeFiltersCount = [
    filterLevels.length > 0,
    searchQuery !== '',
    timeRange.start || timeRange.end,
  ].filter(Boolean).length;

  // Export functions
  const handleExportCSV = () => {
    const options: ExportOptions = {
      filename: `${fileName.replace(/\.[^/.]+$/, '')}-export.csv`,
      includeMetadata: true,
      dateRange: timeRange.start && timeRange.end ? { start: timeRange.start, end: timeRange.end } : undefined
    };
    exportToCSV(filteredLogs, options);
  };

  const handleExportJSON = () => {
    const options: ExportOptions = {
      filename: `${fileName.replace(/\.[^/.]+$/, '')}-export.json`,
      includeMetadata: true,
      dateRange: timeRange.start && timeRange.end ? { start: timeRange.start, end: timeRange.end } : undefined
    };
    exportToJSON(filteredLogs, options);
  };


  return (
    <TooltipProvider delayDuration={500}>
      <div 
        className="flex-shrink-0 p-3 backdrop-blur-sm" 
        style={{ 
          backgroundColor: 'var(--logviewer-bg-secondary)', 
          borderBottom: `1px solid var(--logviewer-border-primary)` 
        }}
      >
        <div className="flex flex-wrap items-center gap-3">
          {/* File Info */}
          <div className="flex items-center gap-2 text-sm flex-shrink-0" style={{ color: 'var(--logviewer-text-primary)' }}>
            <File className="w-4 h-4" style={{ color: 'var(--logviewer-text-secondary)' }} />
            <span className="font-medium truncate max-w-48" title={fileName}>{fileName}</span>
          </div>

          {/* Search */}
          <div className="relative flex-grow min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--logviewer-text-secondary)' }} />
            <Input
                type="text"
                placeholder="Search logs (supports regex)..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="pl-9 pr-20"
                style={{
                  backgroundColor: 'var(--logviewer-bg-tertiary)',
                  border: `1px solid var(--logviewer-border-primary)`,
                  color: 'var(--logviewer-text-primary)'
                }}
                ref={searchInputRef as any}
            />
            {searchQuery && searchResults.length > 0 && (
              <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <span className="text-xs px-2" style={{ color: 'var(--logviewer-text-secondary)' }}>
                  {currentSearchIndex + 1} of {searchResults.length}
                </span>
                <div className="flex flex-col">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onNavigateToPreviousSearch}
                        className="h-3 w-6 p-0"
                        style={{ color: 'var(--logviewer-text-secondary)' }}
                        disabled={searchResults.length === 0}
                      >
                        <ChevronUp className="w-3 h-3" />
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
                      <p>Previous match</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onNavigateToNextSearch}
                        className="h-3 w-6 p-0"
                        style={{ color: 'var(--logviewer-text-secondary)' }}
                        disabled={searchResults.length === 0}
                      >
                        <ChevronDown className="w-3 h-3" />
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
                      <p>Next match</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            )}
          </div>

          {/* Filters Group */}
          <div className="flex items-center gap-1 px-2 py-1 rounded" style={{ backgroundColor: 'var(--logviewer-bg-tertiary)' }}>
            {/* Level Filter */}
            <DropdownMenu open={levelFilterOpen} onOpenChange={setLevelFilterOpen}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      style={{ color: 'var(--logviewer-text-secondary)' }}
                    >
                      <Filter className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent 
                  className="px-2 py-1 text-xs rounded"
                  style={{ 
                    backgroundColor: 'var(--logviewer-bg-elevated)', 
                    color: 'var(--logviewer-text-primary)',
                    border: `1px solid var(--logviewer-border-primary)`
                  }}
                >
                  <p>Filter by level</p>
                </TooltipContent>
              </Tooltip>
              <DropdownMenuContent 
                className="w-64"
                style={{
                  backgroundColor: 'var(--logviewer-bg-elevated)',
                  border: `1px solid var(--logviewer-border-primary)`,
                  color: 'var(--logviewer-text-primary)'
                }}
              >
                <div className="flex items-center justify-between px-2 py-1.5">
                  <DropdownMenuLabel className="p-0">Filter by level</DropdownMenuLabel>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setLevelFilterOpen(false)}
                    className="h-6 w-6 p-0"
                    style={{ color: 'var(--logviewer-text-secondary)' }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <DropdownMenuSeparator style={{ backgroundColor: 'var(--logviewer-border-primary)' }} />
                
                {/* Select All / Unselect All */}
                <div className="px-2 py-1.5">
                  <button
                    onClick={() => {
                      const allSelected = filterLevels.length === LOG_LEVEL_OPTIONS.length;
                      setFilterLevels(allSelected ? [] : LOG_LEVEL_OPTIONS.map(opt => opt.value));
                    }}
                    className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded transition-colors"
                    style={{ 
                      backgroundColor: 'transparent',
                      color: 'var(--logviewer-text-primary)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--logviewer-bg-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div className={`w-4 h-4 border rounded flex items-center justify-center`} style={{
                      backgroundColor: filterLevels.length === LOG_LEVEL_OPTIONS.length ? 'var(--logviewer-accent-primary)' : 
                                      filterLevels.length > 0 ? 'var(--logviewer-accent-primary)' : 'transparent',
                      borderColor: filterLevels.length > 0 ? 'var(--logviewer-accent-primary)' : 'var(--logviewer-border-secondary)',
                      opacity: filterLevels.length > 0 && filterLevels.length < LOG_LEVEL_OPTIONS.length ? 0.5 : 1
                    }}>
                      {filterLevels.length > 0 && (
                        <Check className="w-3 h-3" style={{ color: 'var(--logviewer-text-inverse)' }} />
                      )}
                    </div>
                    <span className="font-medium">
                      {filterLevels.length === LOG_LEVEL_OPTIONS.length ? 'Unselect All' : 'Select All'}
                    </span>
                  </button>
                </div>
                
                <DropdownMenuSeparator style={{ backgroundColor: 'var(--logviewer-border-primary)' }} />
                
                {/* Individual Level Checkboxes */}
                <div className="px-2 py-1">
                  {LOG_LEVEL_OPTIONS.map(opt => {
                    const isChecked = filterLevels.includes(opt.value);
                    return (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setFilterLevels(
                            isChecked
                              ? filterLevels.filter(level => level !== opt.value)
                              : [...filterLevels, opt.value]
                          );
                        }}
                        className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded transition-colors"
                        style={{ backgroundColor: 'transparent' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--logviewer-bg-hover)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <div className={`w-4 h-4 border rounded flex items-center justify-center`} style={{
                          backgroundColor: isChecked ? 'var(--logviewer-accent-primary)' : 'transparent',
                          borderColor: isChecked ? 'var(--logviewer-accent-primary)' : 'var(--logviewer-border-secondary)'
                        }}>
                          {isChecked && (
                            <Check className="w-3 h-3" style={{ color: 'var(--logviewer-text-inverse)' }} />
                          )}
                        </div>
                        <div className={`w-3 h-3 rounded-full ${opt.color}`} />
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Date Range Filter */}
            <Popover>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      style={{ color: 'var(--logviewer-text-secondary)' }}
                    >
                      <Calendar className="w-4 h-4" />
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent 
                  className="px-2 py-1 text-xs rounded"
                  style={{ 
                    backgroundColor: 'var(--logviewer-bg-elevated)', 
                    color: 'var(--logviewer-text-primary)',
                    border: `1px solid var(--logviewer-border-primary)`
                  }}
                >
                  <p>Time range filter</p>
                </TooltipContent>
              </Tooltip>
              <PopoverContent 
                className="w-auto p-0" 
                align="start"
                style={{
                  backgroundColor: 'var(--logviewer-bg-elevated)',
                  border: `1px solid var(--logviewer-border-primary)`
                }}
              >
                <div className="flex gap-4 p-4">
                  <div>
                    <h4 className="font-medium text-sm mb-2" style={{ color: 'var(--logviewer-text-primary)' }}>Start Date</h4>
                    <CalendarComponent
                      mode="single"
                      selected={timeRange.start}
                      onSelect={(date) => setTimeRange((prev:any) => ({...prev, start: date}))}
                      initialFocus
                      className="rounded"
                      style={{
                        backgroundColor: 'var(--logviewer-bg-elevated)',
                        color: 'var(--logviewer-text-primary)'
                      }}
                    />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-2" style={{ color: 'var(--logviewer-text-primary)' }}>End Date</h4>
                    <CalendarComponent
                      mode="single"
                      selected={timeRange.end}
                      onSelect={(date) => setTimeRange((prev:any) => ({...prev, end: date}))}
                      className="rounded"
                      style={{
                        backgroundColor: 'var(--logviewer-bg-elevated)',
                        color: 'var(--logviewer-text-primary)'
                      }}
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Sort Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                    style={{ color: 'var(--logviewer-text-secondary)' }}
                >
                  <ArrowDownUp className="w-4 h-4" />
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
                <p>Sort by time ({sortOrder === 'desc' ? 'Newest First' : 'Oldest First'})</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* View & Analysis Group */}
          <div className="flex items-center gap-1 px-2 py-1 rounded" style={{ backgroundColor: 'var(--logviewer-bg-tertiary)' }}>
            {/* Dashboard Toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onToggleDashboard}
                    style={{ 
                      color: isDashboardVisible ? 'var(--logviewer-accent-primary)' : 'var(--logviewer-text-secondary)',
                      backgroundColor: isDashboardVisible ? 'var(--logviewer-bg-active)' : 'transparent'
                    }}
                >
                  <BarChart3 className="w-4 h-4" />
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
                <p>Toggle analytics dashboard</p>
              </TooltipContent>
            </Tooltip>

            {/* Explain Incident */}
            {onExplainIncident && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onExplainIncident}
                    style={{ color: 'var(--logviewer-text-secondary)' }}
                  >
                    <Sparkles className="w-4 h-4" />
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
                  <p>Analyze current view and summarize incident</p>
                </TooltipContent>
              </Tooltip>
            )}

            {/* LLM status indicator */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 px-2 select-none">
                  <Circle 
                    className="w-2.5 h-2.5" 
                    fill="currentColor"
                    style={{ color: llmAvailable === 'ollama' ? '#4caf50' : '#f44336' }}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent 
                className="px-2 py-1 text-xs rounded"
                style={{ 
                  backgroundColor: 'var(--logviewer-bg-elevated)', 
                  color: 'var(--logviewer-text-primary)',
                  border: `1px solid var(--logviewer-border-primary)`
                }}
              >
                <p>{llmAvailable === 'ollama' ? 'Local AI ready' : 'Local AI offline'}</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Export Dropdown */}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    style={{ color: 'var(--logviewer-text-secondary)' }}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent 
                className="px-2 py-1 text-xs rounded"
                style={{ 
                  backgroundColor: 'var(--logviewer-bg-elevated)', 
                  color: 'var(--logviewer-text-primary)',
                  border: `1px solid var(--logviewer-border-primary)`
                }}
              >
                <p>Export filtered logs</p>
              </TooltipContent>
            </Tooltip>
            <DropdownMenuContent 
              className="w-48"
              style={{
                backgroundColor: 'var(--logviewer-bg-elevated)',
                border: `1px solid var(--logviewer-border-primary)`
              }}
            >
              <DropdownMenuLabel style={{ color: 'var(--logviewer-text-primary)' }}>Export Format</DropdownMenuLabel>
              <DropdownMenuSeparator style={{ backgroundColor: 'var(--logviewer-border-primary)' }} />
              <DropdownMenuCheckboxItem
                onClick={handleExportCSV}
                className="transition-colors"
                style={{ color: 'var(--logviewer-text-primary)' }}
                onMouseEnter={(e: any) => e.currentTarget.style.backgroundColor = 'var(--logviewer-bg-hover)'}
                onMouseLeave={(e: any) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                CSV
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                onClick={handleExportJSON}
                className="transition-colors"
                style={{ color: 'var(--logviewer-text-primary)' }}
                onMouseEnter={(e: any) => e.currentTarget.style.backgroundColor = 'var(--logviewer-bg-hover)'}
                onMouseLeave={(e: any) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                JSON
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Clear Filters Button */}
          {activeFiltersCount > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearAllFilters}
                  className="text-xs"
                  style={{ color: 'var(--logviewer-text-secondary)' }}
                >
                  Clear ({activeFiltersCount})
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
                <p>Remove all active filters</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Count & Clear */}
          <div className="flex items-center gap-4 ml-auto">
            <div className="text-sm" style={{ color: 'var(--logviewer-text-secondary)' }}>
              <span className="font-bold" style={{ color: 'var(--logviewer-accent-primary)' }}>{filteredCount.toLocaleString()}</span>
              /
              <span className="font-bold" style={{ color: 'var(--logviewer-text-primary)' }}>{totalCount.toLocaleString()}</span>
            </div>
            <Popover open={confirmOpen} onOpenChange={setConfirmOpen}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setConfirmOpen(true)}
                        style={{ color: 'var(--logviewer-text-secondary)' }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent 
                  className="px-2 py-1 text-xs rounded"
                  style={{ 
                    backgroundColor: 'var(--logviewer-bg-elevated)', 
                    color: 'var(--logviewer-text-primary)',
                    border: `1px solid var(--logviewer-border-primary)`
                  }}
                >
                  <p>Clear log file</p>
                </TooltipContent>
              </Tooltip>
              <PopoverContent 
                className="w-80 shadow-xl rounded-md p-4" 
                align="end"
                style={{
                  backgroundColor: 'var(--logviewer-bg-elevated)',
                  border: `1px solid var(--logviewer-border-primary)`
                }}
              >
                <div className="space-y-3">
                  <div className="text-sm font-medium" style={{ color: 'var(--logviewer-text-primary)' }}>Clear current log?</div>
                  <p className="text-xs" style={{ color: 'var(--logviewer-text-secondary)' }}>This action removes the loaded entries from view.</p>
                  <div className="flex justify-end gap-2 pt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirmOpen(false)}
                      style={{ color: 'var(--logviewer-text-primary)' }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border"
                      style={{ 
                        borderColor: 'var(--logviewer-error-border)', 
                        color: 'var(--logviewer-error-text)' 
                      }}
                      onClick={() => { setConfirmOpen(false); onClear(null); }}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
