import { useState, useEffect } from 'react';
import { X, File, Search, Calendar, ArrowDownUp, BarChart3, Circle, Download, ChevronUp, ChevronDown, Check } from 'lucide-react';
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
  // Removed API key UI per request
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
    <TooltipProvider delayDuration={1000}>
      <div className="flex-shrink-0 p-3 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700/50 ">
        <div className="flex flex-wrap items-center gap-3">
          {/* File Info */}
          <div className="flex items-center gap-2 text-sm text-gray-300 flex-shrink-0">
            <File className="w-4 h-4 text-gray-500" />
            <span className="font-medium truncate max-w-48" title={fileName}>{fileName}</span>
          </div>

          {/* Search */}
          <div className="relative flex-grow min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
                type="text"
                placeholder="Search logs (supports regex)..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="bg-gray-800 border-gray-700 pl-9 pr-20 text-gray-200 focus:ring-indigo-500 focus:border-indigo-500"
                ref={searchInputRef as any}
            />
            {searchQuery && searchResults.length > 0 && (
              <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <span className="text-xs text-gray-400 px-2">
                  {currentSearchIndex + 1} of {searchResults.length}
                </span>
                <div className="flex flex-col">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onNavigateToPreviousSearch}
                    className="h-3 w-6 p-0 text-gray-400 hover:text-white hover:bg-gray-700"
                    disabled={searchResults.length === 0}
                  >
                    <ChevronUp className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onNavigateToNextSearch}
                    className="h-3 w-6 p-0 text-gray-400 hover:text-white hover:bg-gray-700"
                    disabled={searchResults.length === 0}
                  >
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Level Filter */}
          <DropdownMenu open={levelFilterOpen} onOpenChange={setLevelFilterOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="text-gray-200 bg-gray-800 border-gray-700 hover:bg-gray-700">
                Level {filterLevels.length < LOG_LEVEL_OPTIONS.length && `(${LOG_LEVEL_OPTIONS.length - filterLevels.length} hidden)`}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 bg-gray-800 border-gray-700 text-gray-200">
              <div className="flex items-center justify-between px-2 py-1.5">
                <DropdownMenuLabel className="p-0">Filter by level</DropdownMenuLabel>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLevelFilterOpen(false)}
                  className="h-6 w-6 p-0 text-gray-400 hover:text-white hover:bg-gray-700"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <DropdownMenuSeparator className="bg-gray-700" />
              
              {/* Select All / Unselect All */}
              <div className="px-2 py-1.5">
                <button
                  onClick={() => {
                    const allSelected = filterLevels.length === LOG_LEVEL_OPTIONS.length;
                    setFilterLevels(allSelected ? [] : LOG_LEVEL_OPTIONS.map(opt => opt.value));
                  }}
                  className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded hover:bg-gray-700 transition-colors"
                >
                  <div className={`w-4 h-4 border rounded flex items-center justify-center ${
                    filterLevels.length === LOG_LEVEL_OPTIONS.length
                      ? 'bg-indigo-600 border-indigo-600'
                      : filterLevels.length > 0
                      ? 'bg-indigo-600/50 border-indigo-600'
                      : 'border-gray-600'
                  }`}>
                    {filterLevels.length > 0 && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <span className="font-medium">
                    {filterLevels.length === LOG_LEVEL_OPTIONS.length ? 'Unselect All' : 'Select All'}
                  </span>
                </button>
              </div>
              
              <DropdownMenuSeparator className="bg-gray-700" />
              
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
                      className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded hover:bg-gray-700 transition-colors"
                    >
                      <div className={`w-4 h-4 border rounded flex items-center justify-center ${
                        isChecked ? 'bg-indigo-600 border-indigo-600' : 'border-gray-600'
                      }`}>
                        {isChecked && (
                          <Check className="w-3 h-3 text-white" />
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
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-200">
                <Calendar className="w-4 h-4 mr-2" />
                Time
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700" align="start">
              <div className="flex gap-4 p-4">
                <div>
                  <h4 className="font-medium text-sm mb-2 text-gray-300">Start Date</h4>
                  <CalendarComponent
                    mode="single"
                    selected={timeRange.start}
                    onSelect={(date) => setTimeRange((prev:any) => ({...prev, start: date}))}
                    initialFocus
                    className="bg-gray-800 text-gray-200"
                  />
                </div>
                <div>
                  <h4 className="font-medium text-sm mb-2 text-gray-300">End Date</h4>
                  <CalendarComponent
                    mode="single"
                    selected={timeRange.end}
                    onSelect={(date) => setTimeRange((prev:any) => ({...prev, end: date}))}
                    className="bg-gray-800 text-gray-200"
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
                  className="text-gray-400 hover:bg-gray-700 hover:text-white"
              >
                <ArrowDownUp className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="bg-gray-700 text-gray-200 border-gray-600">
              <p>Sort by time ({sortOrder === 'desc' ? 'Newest First' : 'Oldest First'})</p>
            </TooltipContent>
          </Tooltip>

          {/* Dashboard Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                  variant={isDashboardVisible ? "default" : "ghost"}
                  size="icon"
                  onClick={onToggleDashboard}
                  className={isDashboardVisible ? "bg-indigo-600 hover:bg-indigo-700" : "text-gray-400 hover:bg-gray-700 hover:text-white"}
              >
                <BarChart3 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="bg-gray-700 text-gray-200 border-gray-600">
              <p>Toggle analytics dashboard</p>
            </TooltipContent>
          </Tooltip>

          {/* Explain Incident */}
          {onExplainIncident && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onExplainIncident}
                  className="text-gray-200 bg-gray-800 border-gray-700 hover:bg-gray-700"
                >
                  <Sparkles className="w-4 h-4 mr-2 text-indigo-400" />
                  Explain
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-gray-700 text-gray-200 border-gray-600">
                <p>Analyze current view and summarize incident</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* LLM status indicator (next to the button) */}
          <div className="flex items-center gap-1 text-xs select-none">
            <Circle className={`w-2.5 h-2.5 ${llmAvailable === 'ollama' ? 'text-green-400' : 'text-red-500'}`} fill="currentColor" />
            <span className="text-gray-400">{llmAvailable === 'ollama' ? 'Local AI ready' : 'Local AI offline'}</span>
          </div>

          {/* Export Dropdown */}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-gray-200 bg-gray-800 border-gray-700 hover:bg-gray-700"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent className="bg-gray-700 text-gray-200 border-gray-600">
                <p>Export filtered logs</p>
              </TooltipContent>
            </Tooltip>
            <DropdownMenuContent className="w-48 bg-gray-800 border-gray-700">
              <DropdownMenuLabel className="text-gray-200">Export Format</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-700" />
              <DropdownMenuCheckboxItem
                onClick={handleExportCSV}
                className="text-gray-200 hover:bg-gray-700 focus:bg-gray-700"
              >
                CSV
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                onClick={handleExportJSON}
                className="text-gray-200 hover:bg-gray-700 focus:bg-gray-700"
              >
                JSON
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* API Key UI removed */}

          {/* Clear Filters Button */}
          {activeFiltersCount > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-gray-400 hover:text-white">
                  Clear Filters ({activeFiltersCount})
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-gray-700 text-gray-200 border-gray-600">
                <p>Remove all active filters</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Count & Clear */}
          <div className="flex items-center gap-4 ml-auto">
            <div className="text-sm text-gray-400">
              <span className="font-bold text-indigo-400">{filteredCount.toLocaleString()}</span>
              /
              <span className="font-bold text-gray-300">{totalCount.toLocaleString()}</span>
            </div>
            <Popover open={confirmOpen} onOpenChange={setConfirmOpen}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfirmOpen(true)}
                        className="text-gray-400 hover:bg-gray-700 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent className="bg-gray-700 text-gray-200 border-gray-600">
                  <p>Clear log file</p>
                </TooltipContent>
              </Tooltip>
              <PopoverContent className="w-80 bg-gray-800 border border-gray-700 shadow-xl rounded-md p-4" align="end">
                <div className="space-y-3">
                  <div className="text-sm text-gray-300 font-medium">Clear current log?</div>
                  <p className="text-xs text-gray-400">This action removes the loaded entries from view.</p>
                  <div className="flex justify-end gap-2 pt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-300 hover:text-white hover:bg-gray-700"
                      onClick={() => setConfirmOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-600 text-red-300 hover:bg-red-600/20 hover:text-red-200"
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
