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
    <div className="h-full flex flex-col" style={{ backgroundColor: 'var(--logviewer-bg-primary)', color: 'var(--logviewer-text-primary)' }}>
      {/* Header */}
      <div className="flex-shrink-0 p-4" style={{ borderBottom: `1px solid var(--logviewer-border-primary)` }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              style={{ color: 'var(--logviewer-text-secondary)' }}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2">
              <History className="w-6 h-6" style={{ color: 'var(--logviewer-accent-primary)' }} />
              <h1 className="text-xl font-semibold" style={{ color: 'var(--logviewer-text-primary)' }}>Log History</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAllHistory}
              className="border"
              style={{
                color: 'var(--logviewer-text-primary)',
                backgroundColor: 'var(--logviewer-bg-secondary)',
                borderColor: 'var(--logviewer-border-primary)'
              }}
              disabled={historyEntries.length === 0}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex-shrink-0 p-4" style={{ borderBottom: `1px solid var(--logviewer-border-primary)` }}>
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: 'var(--logviewer-text-secondary)' }} />
            <Input
              placeholder="Search history entries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              style={{
                backgroundColor: 'var(--logviewer-bg-secondary)',
                border: `1px solid var(--logviewer-border-primary)`,
                color: 'var(--logviewer-text-primary)'
              }}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
            className="border"
            style={{
              color: 'var(--logviewer-text-primary)',
              backgroundColor: 'var(--logviewer-bg-secondary)',
              borderColor: 'var(--logviewer-border-primary)'
            }}
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
              <div style={{ color: 'var(--logviewer-text-secondary)' }}>Loading history...</div>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32" style={{ color: 'var(--logviewer-text-secondary)' }}>
              <History className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">No history entries found</p>
              <p className="text-sm">Paste logs to start building your history</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEntries.map((entry) => (
                <Card
                  key={entry.id}
                  className="cursor-pointer transition-all border"
                  style={{
                    backgroundColor: selectedEntry?.id === entry.id ? 'var(--logviewer-bg-secondary)' : 'var(--logviewer-bg-tertiary)',
                    borderColor: selectedEntry?.id === entry.id ? 'var(--logviewer-accent-primary)' : 'var(--logviewer-border-primary)',
                    borderWidth: selectedEntry?.id === entry.id ? '2px' : '1px'
                  }}
                  onClick={() => setSelectedEntry(entry)}
                  onMouseEnter={(e) => {
                    if (selectedEntry?.id !== entry.id) {
                      e.currentTarget.style.backgroundColor = 'var(--logviewer-bg-hover)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedEntry?.id !== entry.id) {
                      e.currentTarget.style.backgroundColor = 'var(--logviewer-bg-tertiary)';
                    }
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="w-4 h-4" style={{ color: 'var(--logviewer-text-secondary)' }} />
                          <span className="text-sm" style={{ color: 'var(--logviewer-text-secondary)' }}>{formatDate(entry.timestamp)}</span>
                          <span 
                            className="text-xs px-2 py-1 rounded"
                            style={{ 
                              backgroundColor: 'var(--logviewer-bg-primary)', 
                              color: 'var(--logviewer-text-primary)' 
                            }}
                          >
                            {entry.logCount} logs
                          </span>
                        </div>
                        <p className="text-sm font-mono" style={{ color: 'var(--logviewer-text-primary)' }}>
                          {truncatePreview(entry.preview)}
                        </p>
                        <p className="text-xs mt-1" style={{ color: 'var(--logviewer-text-tertiary)' }}>ID: {entry.id}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLoadEntry(entry);
                          }}
                          style={{ color: 'var(--logviewer-text-secondary)' }}
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
                          style={{ color: 'var(--logviewer-text-secondary)' }}
                          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--logviewer-error-text)'}
                          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--logviewer-text-secondary)'}
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
          <div className="w-96 p-4 overflow-auto" style={{ borderLeft: `1px solid var(--logviewer-border-primary)` }}>
            <Card 
              className="border"
              style={{ 
                backgroundColor: 'var(--logviewer-bg-secondary)', 
                borderColor: 'var(--logviewer-border-primary)' 
              }}
            >
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2" style={{ color: 'var(--logviewer-text-primary)' }}>
                  <FileText className="w-4 h-4" />
                  Entry Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm" style={{ color: 'var(--logviewer-text-secondary)' }}>Date & Time</label>
                  <p style={{ color: 'var(--logviewer-text-primary)' }}>{new Date(selectedEntry.timestamp).toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm" style={{ color: 'var(--logviewer-text-secondary)' }}>Log Count</label>
                  <p style={{ color: 'var(--logviewer-text-primary)' }}>{selectedEntry.logCount} entries</p>
                </div>
                <div>
                  <label className="text-sm" style={{ color: 'var(--logviewer-text-secondary)' }}>Entry ID</label>
                  <p className="font-mono text-xs break-all" style={{ color: 'var(--logviewer-text-primary)' }}>{selectedEntry.id}</p>
                </div>
                <div>
                  <label className="text-sm" style={{ color: 'var(--logviewer-text-secondary)' }}>Preview</label>
                  <div 
                    className="p-3 rounded border"
                    style={{ 
                      backgroundColor: 'var(--logviewer-bg-primary)', 
                      borderColor: 'var(--logviewer-border-primary)' 
                    }}
                  >
                    <pre className="text-xs whitespace-pre-wrap" style={{ color: 'var(--logviewer-text-primary)' }}>
                      {selectedEntry.preview}
                    </pre>
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => handleLoadEntry(selectedEntry)}
                    className="flex-1"
                    style={{ 
                      backgroundColor: 'var(--logviewer-accent-primary)', 
                      color: 'var(--logviewer-text-inverse)' 
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Load Entry
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleDeleteEntry(selectedEntry.id)}
                    className="border"
                    style={{ 
                      color: 'var(--logviewer-error-text)', 
                      borderColor: 'var(--logviewer-error-border)' 
                    }}
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
