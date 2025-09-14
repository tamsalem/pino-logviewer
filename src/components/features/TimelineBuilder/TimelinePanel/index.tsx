import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  FileText, 
  Download, 
  Trash2, 
  Clock,
  AlertCircle,
  Info,
  CheckCircle,
  Bug,
  Plus,
  AlertTriangle
} from 'lucide-react';
import { Button } from '../../../../../components/ui/button';
import { Card, CardContent, CardHeader } from '../../../../../components/ui/card';
import { useTimeline } from '../../../../contexts/TimelineContext';
import TimelineCard from '../TimelineCard';
import { TimelineExportOptions } from '../../../../types/timeline';

interface TimelinePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (options: TimelineExportOptions) => void;
}

const getLevelIcon = (level: string) => {
  switch (level) {
    case 'ERROR':
      return <AlertCircle className="w-4 h-4 text-red-400" />;
    case 'WARN':
      return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
    case 'INFO':
      return <Info className="w-4 h-4 text-blue-400" />;
    case 'DEBUG':
      return <Bug className="w-4 h-4 text-gray-400" />;
    default:
      return <CheckCircle className="w-4 h-4 text-gray-400" />;
  }
};

const getLevelCount = (events: any[], level: string) => {
  return events.filter(event => event.logEntry.level === level).length;
};

export default function TimelinePanel({ isOpen, onClose, onExport }: TimelinePanelProps) {
  const { state, removeEvent, addAnnotation, updateAnnotation, removeAnnotation, selectEvent, clearTimeline, reorderEvents } = useTimeline();
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportOptions, setExportOptions] = useState<TimelineExportOptions>({
    format: 'markdown',
    includeAnnotations: true,
    includeRawData: false,
  });

  const { events } = state;
  const sortedEvents = [...events].sort((a, b) => new Date(a.logEntry.timestamp).getTime() - new Date(b.logEntry.timestamp).getTime());

  const handleExport = () => {
    onExport(exportOptions);
    setShowExportDialog(false);
  };

  const handleClearTimeline = () => {
    if (confirm('Are you sure you want to clear all timeline events? This action cannot be undone.')) {
      clearTimeline();
      setSelectedEventId(null);
    }
  };


  const handleReorder = useCallback((draggedId: string, targetId: string) => {
    const draggedIndex = events.findIndex(e => e.id === draggedId);
    const targetIndex = events.findIndex(e => e.id === targetId);
    
    if (draggedIndex === -1 || targetIndex === -1) return;
    
    const newEvents = [...events];
    const [draggedEvent] = newEvents.splice(draggedIndex, 1);
    newEvents.splice(targetIndex, 0, draggedEvent);
    
    // Update order property
    const reorderedEvents = newEvents.map((event, index) => ({
      ...event,
      order: index
    }));
    
    reorderEvents(reorderedEvents.map(e => e.id));
  }, [events, reorderEvents]);

  const getTimeRange = () => {
    if (events.length === 0) return null;
    
    const timestamps = events.map(event => new Date(event.logEntry.timestamp));
    const start = new Date(Math.min(...timestamps.map(t => t.getTime())));
    const end = new Date(Math.max(...timestamps.map(t => t.getTime())));
    
    return { start, end };
  };

  const timeRange = getTimeRange();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />
          
          {/* Bottom Panel */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 h-96 bg-gray-900 border-t border-gray-700 z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-gray-700">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <h2 className="text-base font-semibold text-white">Event Timeline</h2>
                {events.length > 0 && (
                  <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">
                    {events.length} events
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-6 w-6 p-0 text-gray-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>

            {/* Stats */}
            {events.length > 0 && (
              <div className="px-3 py-2 border-b border-gray-700">
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    {getLevelIcon('ERROR')}
                    <span className="text-gray-400">Errors:</span>
                    <span className="text-red-400 font-medium">{getLevelCount(events, 'ERROR')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {getLevelIcon('WARN')}
                    <span className="text-gray-400">Warnings:</span>
                    <span className="text-yellow-400 font-medium">{getLevelCount(events, 'WARN')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {getLevelIcon('INFO')}
                    <span className="text-gray-400">Info:</span>
                    <span className="text-blue-400 font-medium">{getLevelCount(events, 'INFO')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {getLevelIcon('DEBUG')}
                    <span className="text-gray-400">Debug:</span>
                    <span className="text-gray-400 font-medium">{getLevelCount(events, 'DEBUG')}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="px-3 py-2 border-b border-gray-700">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowExportDialog(true)}
                  disabled={events.length === 0}
                  className="text-xs bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-3 h-3 mr-1" />
                  Export
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearTimeline}
                  disabled={events.length === 0}
                  className="text-xs bg-red-900/20 border-red-500/50 text-red-300 hover:bg-red-800/30 hover:text-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Clear
                </Button>
              </div>
            </div>

            {/* Events List */}
            <div className="flex-1 overflow-auto p-3">
              {events.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Clock className="w-8 h-8 text-gray-600 mb-3" />
                  <h3 className="text-sm font-medium text-gray-400 mb-2">No Events Yet</h3>
                  <p className="text-xs text-gray-500 max-w-xs">
                    Click the clock icon on log entries to add them to your investigation timeline.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sortedEvents.map((event) => (
                    <TimelineCard
                      key={event.id}
                      event={event}
                      onRemove={removeEvent}
                      onAddAnnotation={addAnnotation}
                      onUpdateAnnotation={updateAnnotation}
                      onRemoveAnnotation={removeAnnotation}
                      isSelected={selectedEventId === event.id}
                      onSelect={setSelectedEventId}
                      onReorder={handleReorder}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Export Dialog */}
            <AnimatePresence>
              {showExportDialog && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-gray-900/95 flex items-center justify-center p-4"
                >
                  <Card className="w-full max-w-sm bg-gray-800 border-gray-700">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-white">Export Investigation Report</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowExportDialog(false)}
                          className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-300 mb-2 block">Format</label>
                        <div className="flex gap-2">
                          <Button
                            variant={exportOptions.format === 'markdown' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setExportOptions({ ...exportOptions, format: 'markdown' })}
                            className={`flex-1 text-xs ${
                              exportOptions.format === 'markdown' 
                                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                                : 'bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700 hover:text-white'
                            }`}
                          >
                            <FileText className="w-3 h-3 mr-1" />
                            Markdown
                          </Button>
                          <Button
                            variant={exportOptions.format === 'json' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setExportOptions({ ...exportOptions, format: 'json' })}
                            className={`flex-1 text-xs ${
                              exportOptions.format === 'json' 
                                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                                : 'bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700 hover:text-white'
                            }`}
                          >
                            JSON
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm text-gray-300">
                          <input
                            type="checkbox"
                            checked={exportOptions.includeAnnotations}
                            onChange={(e) => setExportOptions({ ...exportOptions, includeAnnotations: e.target.checked })}
                            className="rounded border-gray-600 bg-gray-700"
                          />
                          Include annotations/notes
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-300">
                          <input
                            type="checkbox"
                            checked={exportOptions.includeRawData}
                            onChange={(e) => setExportOptions({ ...exportOptions, includeRawData: e.target.checked })}
                            className="rounded border-gray-600 bg-gray-700"
                          />
                          Include raw log data
                        </label>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowExportDialog(false)}
                          className="flex-1 text-xs bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700 hover:text-white"
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleExport}
                          className="flex-1 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Export
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
