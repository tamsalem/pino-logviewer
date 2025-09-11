import React, { useState, useEffect } from 'react';
import { Button } from '../../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Input } from '../../../../components/ui/input';
import { 
  History, 
  Search, 
  Calendar, 
  FileText, 
  Trash2, 
  Download, 
  Eye,
  ArrowLeft,
  Filter,
  SortAsc,
  SortDesc
} from 'lucide-react';
import { electronAPI } from '../../../utils';

interface HistoryEntry {
  id: string;
  timestamp: number;
  logCount: number;
  preview: string;
  logs: any[];
}

interface HistoryScreenProps {
  onBack: () => void;
  onLoadHistory: (logs: any[], name: string) => void;
}

export default function HistoryScreen({ onBack, onLoadHistory }: HistoryScreenProps) {
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<HistoryEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    filterAndSortEntries();
  }, [historyEntries, searchQuery, sortOrder]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const history = await electronAPI.getHistory();
      setHistoryEntries(history);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortEntries = () => {
    let filtered = [...historyEntries];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(entry => 
        entry.preview.toLowerCase().includes(query) ||
        entry.id.toLowerCase().includes(query)
      );
    }

    // Sort entries
    filtered.sort((a, b) => {
      if (sortOrder === 'newest') {
        return b.timestamp - a.timestamp;
      } else {
        return a.timestamp - b.timestamp;
      }
    });

    setFilteredEntries(filtered);
  };

  const handleLoadEntry = async (entry: HistoryEntry) => {
    try {
      const logs = await electronAPI.loadHistoryEntry(entry.id);
      
      if (!logs || !Array.isArray(logs)) {
        console.error('Invalid logs data received:', logs);
        alert('Failed to load history entry: Invalid data received');
        return;
      }
      
      onLoadHistory(logs, `History - ${new Date(entry.timestamp).toLocaleString()}`);
    } catch (error) {
      console.error('Failed to load history entry:', error);
      alert(`Failed to load history entry: ${(error as { message?: string })?.['message']}`);
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (confirm('Are you sure you want to delete this history entry?')) {
      try {
        await electronAPI.clearHistory(entryId);
        await loadHistory();
        if (selectedEntry?.id === entryId) {
          setSelectedEntry(null);
        }
      } catch (error) {
        console.error('Failed to delete history entry:', error);
      }
    }
  };

  const handleClearAllHistory = async () => {
    if (confirm('Are you sure you want to clear all history? This action cannot be undone.')) {
      try {
        await electronAPI.clearHistory();
        setHistoryEntries([]);
        setSelectedEntry(null);
      } catch (error) {
        console.error('Failed to clear history:', error);
      }
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString();
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    } else {
      return date.toLocaleDateString();
    }
  };

  const truncatePreview = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="h-full flex flex-col bg-gray-900 text-gray-200">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-700/50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="text-gray-400 hover:text-white hover:bg-gray-800"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2">
              <History className="w-6 h-6 text-indigo-400" />
              <h1 className="text-xl font-semibold text-white">Log History</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAllHistory}
              className="text-gray-300 bg-gray-800 border-gray-700 hover:bg-gray-700"
              disabled={historyEntries.length === 0}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex-shrink-0 p-4 border-b border-gray-700/50">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search history entries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-400"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
            className="text-gray-300 bg-gray-800 border-gray-700 hover:bg-gray-700"
          >
            {sortOrder === 'newest' ? <SortDesc className="w-4 h-4 mr-2" /> : <SortAsc className="w-4 h-4 mr-2" />}
            {sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-grow min-h-0 flex">
        {/* History List */}
        <div className="flex-1 p-4 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-gray-400">Loading history...</div>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-400">
              <History className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">No history entries found</p>
              <p className="text-sm">Paste logs to start building your history</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEntries.map((entry) => (
                <Card
                  key={entry.id}
                  className={`cursor-pointer transition-all hover:bg-gray-800/50 ${
                    selectedEntry?.id === entry.id ? 'ring-2 ring-indigo-500 bg-gray-800/50' : 'bg-gray-800/30'
                  }`}
                  onClick={() => setSelectedEntry(entry)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-400">{formatDate(entry.timestamp)}</span>
                          <span className="text-xs bg-gray-700 px-2 py-1 rounded text-gray-300">
                            {entry.logCount} logs
                          </span>
                        </div>
                        <p className="text-gray-200 text-sm font-mono">
                          {truncatePreview(entry.preview)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">ID: {entry.id}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLoadEntry(entry);
                          }}
                          className="text-gray-400 hover:text-white hover:bg-gray-700"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteEntry(entry.id);
                          }}
                          className="text-gray-400 hover:text-red-400 hover:bg-gray-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Entry Details */}
        {selectedEntry && (
          <div className="w-96 border-l border-gray-700/50 p-4 overflow-auto">
            <Card className="bg-gray-800/50">
              <CardHeader>
                <CardTitle className="text-gray-200 text-base flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Entry Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-gray-400 text-sm">Date & Time</label>
                  <p className="text-gray-200">{new Date(selectedEntry.timestamp).toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Log Count</label>
                  <p className="text-gray-200">{selectedEntry.logCount} entries</p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Entry ID</label>
                  <p className="text-gray-200 font-mono text-xs break-all">{selectedEntry.id}</p>
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Preview</label>
                  <div className="bg-gray-900 p-3 rounded border border-gray-700">
                    <pre className="text-gray-300 text-xs whitespace-pre-wrap">
                      {selectedEntry.preview}
                    </pre>
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => handleLoadEntry(selectedEntry)}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Load Entry
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleDeleteEntry(selectedEntry.id)}
                    className="text-red-400 border-red-400 hover:bg-red-400 hover:text-white"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
