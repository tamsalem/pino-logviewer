import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, AlertCircle, Info, CheckCircle, Bug, AlertTriangle, Download, Trash2, GripVertical } from 'lucide-react';
import { Button } from '../../../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../components/ui/card';
import { Input } from '../../../../../components/ui/input';
import { useTimeline } from '../../../../contexts/TimelineContext';
import { TimelineEvent, TimelineAnnotation } from '../../../../types/timeline';
import { LogLevel } from '../../../../types';
import { LOG_LEVEL_COLORS } from '../../../../constants';

// Color mapping for level indicators
const LEVEL_COLOR_MAP = {
  ERROR: '#ef4444', // red-500
  WARN: '#eab308',  // yellow-500
  INFO: '#3b82f6',  // blue-500
  DEBUG: '#10b981', // emerald-500
  NO_LEVEL: '#6b7280', // gray-500
} as const;
import { exportTimelineToMarkdown, exportTimelineToJSON } from '../../../../utils/timeline-export';

interface CaseboardProps {
  isOpen: boolean;
  onClose: () => void;
}

// JsonViewer component for displaying JSON data
const JsonViewer = ({ data }: { data: unknown }) => {
  const renderValue = (key: number | string | null, value: unknown, level = 0) => {
    const indent = '  '.repeat(Math.max(0, level));
    
    if (value === null) {
      return <span className="text-purple-400">null</span>;
    }
    if (typeof value === 'string') {
      return <span className="text-green-400">"{value}"</span>;
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
                <span className="text-blue-400">"{String(k)}"</span>
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

  return <pre className="font-mono text-xs leading-relaxed overflow-x-auto">{renderValue(null, data, 0)}</pre>;
};

// Annotation Item Component
function AnnotationItem({ 
  annotation, 
  onUpdate, 
  onRemove 
}: { 
  annotation: TimelineAnnotation; 
  onUpdate: (content: string) => void; 
  onRemove: () => void; 
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(annotation.content);

  const handleSave = () => {
    if (content.trim()) {
      onUpdate(content.trim());
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setContent(annotation.content);
    setIsEditing(false);
  };

  return (
    <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
      {isEditing ? (
        <div className="space-y-2">
          <Input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') handleCancel();
            }}
            className="bg-gray-900 border-gray-600 text-gray-200"
            autoFocus
          />
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSave}
              className="h-6 px-2 text-xs bg-green-900/20 border border-green-500/50 text-green-300 hover:bg-green-800/30 hover:text-green-200"
            >
              Save
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="h-6 px-2 text-xs bg-gray-700 border border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm text-gray-300 flex-1">{annotation.content}</p>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="h-6 w-6 p-0 bg-blue-900/20 border border-blue-500/50 text-blue-300 hover:bg-blue-800/30 hover:text-blue-200"
            >
              ✏️
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="h-6 w-6 p-0 bg-red-900/20 border border-red-500/50 text-red-300 hover:bg-red-800/30 hover:text-red-200"
            >
              🗑️
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Event Card Component for Caseboard
function CaseboardEventCard({ 
  event, 
  isSelected, 
  onSelect, 
  onRemove, 
  onAddAnnotation, 
  onUpdateAnnotation, 
  onRemoveAnnotation,
  onReorder 
}: {
  event: TimelineEvent;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onAddAnnotation: (content: string) => void;
  onUpdateAnnotation: (annotationId: string, content: string) => void;
  onRemoveAnnotation: (annotationId: string) => void;
  onReorder?: (draggedId: string, targetId: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAddingAnnotation, setIsAddingAnnotation] = useState(false);
  const [newAnnotation, setNewAnnotation] = useState('');

  const { logEntry, annotations } = event;
  const levelName = logEntry.level || 'NO_LEVEL';
  const levelColor = LEVEL_COLOR_MAP[levelName as keyof typeof LEVEL_COLOR_MAP] || LEVEL_COLOR_MAP.NO_LEVEL;

  const handleAddAnnotation = () => {
    if (newAnnotation.trim()) {
      onAddAnnotation(newAnnotation.trim());
      setNewAnnotation('');
      setIsAddingAnnotation(false);
    }
  };

  const handleCardDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', event.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleCardDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleCardDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain');
    if (draggedId && draggedId !== event.id && onReorder) {
      onReorder(draggedId, event.id);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      className={`relative ${onReorder ? 'cursor-move' : ''}`}
      draggable={!!onReorder}
      onDragStartCapture={handleCardDragStart}
      onDragOver={handleCardDragOver}
      onDrop={handleCardDrop}
    >
      <Card
        className={`bg-gray-800 border-gray-700 hover:border-gray-600 transition-all duration-200 ${
          isSelected ? 'ring-2 ring-blue-500' : ''
        }`}
        onClick={onSelect}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {onReorder && (
                <div className="cursor-grab active:cursor-grabbing">
                  <GripVertical className="w-4 h-4 text-gray-500" />
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: levelColor }}
                />
                <span className={`text-xs font-bold px-2 py-1 rounded ${
                  levelName === 'ERROR' ? 'bg-red-500/20 text-red-300' :
                  levelName === 'WARN' ? 'bg-yellow-500/20 text-yellow-300' :
                  levelName === 'INFO' ? 'bg-blue-500/20 text-blue-300' :
                  levelName === 'DEBUG' ? 'bg-gray-500/20 text-gray-400' :
                  'bg-white/20 text-white'
                }`}>
                  {levelName}
                </span>
              </div>

              <span className="text-xs text-gray-400 font-mono">
                {new Date(logEntry.timestamp).toLocaleTimeString()}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                className="h-6 w-6 p-0 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white"
              >
                {isExpanded ? '▼' : '▶'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
                className="h-6 w-6 p-0 bg-red-900/20 hover:bg-red-800/30 text-red-400 hover:text-red-300"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>

          <div className="text-sm text-gray-200 font-mono truncate">
            {logEntry.message || 'No message'}
          </div>
        </CardHeader>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {/* Log Details */}
                  <div className="bg-gray-900/50 rounded-lg p-2 border border-gray-700/50">
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs mb-2 pb-2 border-b border-gray-700">
                      <div>
                        <span className="text-gray-500">Timestamp:</span>
                        <div className="font-mono text-gray-300 mt-1">
                          {new Date(logEntry.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">Level:</span>
                        <div className="text-gray-300 mt-1">{levelName}</div>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-500">Message:</span>
                        <div className="font-mono text-gray-300 mt-1">
                          {logEntry.message || 'No message'}
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-gray-400 font-medium mb-1 text-xs">Raw Data:</h4>
                      <div className="bg-gray-950 rounded-md p-2 overflow-x-auto max-h-32">
                        {logEntry.isJson ? (
                          <JsonViewer data={logEntry.data} />
                        ) : (
                          <pre className="font-mono text-xs text-gray-300 whitespace-pre-wrap">
                            {logEntry.raw}
                          </pre>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Annotations */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-gray-300 font-medium text-xs">
                        Notes ({annotations.length})
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsAddingAnnotation(true)}
                        className="h-6 px-2 text-xs bg-blue-900/20 border border-blue-500/50 text-blue-300 hover:bg-blue-800/30 hover:text-blue-200"
                      >
                        + Add Note
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {annotations.map((annotation) => (
                        <AnnotationItem
                          key={annotation.id}
                          annotation={annotation}
                          onUpdate={(content) => onUpdateAnnotation(annotation.id, content)}
                          onRemove={() => onRemoveAnnotation(annotation.id)}
                        />
                      ))}

                      {isAddingAnnotation && (
                        <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
                          <Input
                            value={newAnnotation}
                            onChange={(e) => setNewAnnotation(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleAddAnnotation();
                              if (e.key === 'Escape') {
                                setNewAnnotation('');
                                setIsAddingAnnotation(false);
                              }
                            }}
                            placeholder="Add your note..."
                            className="bg-gray-900 border-gray-600 text-gray-200 mb-2"
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleAddAnnotation}
                              className="h-6 px-2 text-xs bg-green-900/20 border border-green-500/50 text-green-300 hover:bg-green-800/30 hover:text-green-200"
                            >
                              Add
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setNewAnnotation('');
                                setIsAddingAnnotation(false);
                              }}
                              className="h-6 px-2 text-xs bg-gray-700 border border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}

export default function Caseboard({ isOpen, onClose }: CaseboardProps) {
  const { state, removeEvent, addAnnotation, updateAnnotation, removeAnnotation, reorderEvents, selectEvent, clearTimeline } = useTimeline();
  const { events, selectedEventId } = state;
  const [showExportDialog, setShowExportDialog] = useState(false);

  const sortedEvents = [...events].sort((a, b) => a.order - b.order || new Date(a.logEntry.timestamp).getTime() - new Date(b.logEntry.timestamp).getTime());
  const selectedEvent = events.find(e => e.id === selectedEventId);

  const handleReorder = useCallback((draggedId: string, targetId: string) => {
    const draggedIndex = events.findIndex(e => e.id === draggedId);
    const targetIndex = events.findIndex(e => e.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newEvents = [...events];
    const [draggedEvent] = newEvents.splice(draggedIndex, 1);
    newEvents.splice(targetIndex, 0, draggedEvent);

    const reorderedEvents = newEvents.map((event, index) => ({
      ...event,
      order: index
    }));

    reorderEvents(reorderedEvents.map(e => e.id));
  }, [events, reorderEvents]);

  const handleExport = async (format: 'markdown' | 'json') => {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `investigation-report-${timestamp}`;
    
    if (format === 'markdown') {
      await exportTimelineToMarkdown(events, { format, includeAnnotations: true, includeRawData: false, filename });
    } else {
      await exportTimelineToJSON(events, { format, includeAnnotations: true, includeRawData: true, filename });
    }
    
    setShowExportDialog(false);
  };

  const handleClearTimeline = () => {
    if (window.confirm('Are you sure you want to clear all events from the timeline?')) {
      clearTimeline();
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-gray-900 z-50 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800">
        <div className="flex items-center gap-3">
          <Clock className="w-6 h-6 text-blue-400" />
          <h1 className="text-xl font-bold text-white">Caseboard Mode</h1>
          {events.length > 0 && (
            <span className="text-sm text-gray-400 bg-gray-700 px-3 py-1 rounded-full">
              {events.length} events
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowExportDialog(true)}
            disabled={events.length === 0}
            className="bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600 hover:text-white disabled:opacity-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearTimeline}
            disabled={events.length === 0}
            className="bg-red-900/20 border-red-500/50 text-red-300 hover:bg-red-800/30 hover:text-red-200 disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600 hover:text-white"
          >
            <X className="w-4 h-4 mr-2" />
            Exit Caseboard
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side - Event Cards */}
        <div className="w-1/2 border-r border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-700 bg-gray-800">
            <h2 className="text-lg font-semibold text-white">Timeline Events</h2>
            <p className="text-sm text-gray-400">Click on events to view details and add notes</p>
          </div>
          
          <div className="flex-1 overflow-auto p-4">
            {events.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Clock className="w-16 h-16 text-gray-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-400 mb-2">No Events Yet</h3>
                <p className="text-sm text-gray-500 max-w-md">
                  Add log entries to your timeline by clicking the clock icon on log entries in the main view, then return here to build your case.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedEvents.map((event) => (
                  <CaseboardEventCard
                    key={event.id}
                    event={event}
                    isSelected={selectedEventId === event.id}
                    onSelect={() => selectEvent(event.id)}
                    onRemove={() => removeEvent(event.id)}
                    onAddAnnotation={(content) => addAnnotation(event.id, content)}
                    onUpdateAnnotation={(annotationId, content) => updateAnnotation(event.id, annotationId, content)}
                    onRemoveAnnotation={(annotationId) => removeAnnotation(event.id, annotationId)}
                    onReorder={handleReorder}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Event Details */}
        <div className="w-1/2 flex flex-col">
          <div className="p-4 border-b border-gray-700 bg-gray-800">
            <h2 className="text-lg font-semibold text-white">Event Details</h2>
            <p className="text-sm text-gray-400">Detailed view and note editor</p>
          </div>
          
          <div className="flex-1 overflow-auto p-4">
            {selectedEvent ? (
              <div className="space-y-4">
                {/* Event Summary */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: LEVEL_COLOR_MAP[selectedEvent.logEntry.level as keyof typeof LEVEL_COLOR_MAP] || LEVEL_COLOR_MAP.NO_LEVEL }}
                      />
                      {selectedEvent.logEntry.level} Event
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <span className="text-gray-500 text-sm">Timestamp:</span>
                        <div className="font-mono text-gray-300">
                          {new Date(selectedEvent.logEntry.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500 text-sm">Message:</span>
                        <div className="font-mono text-gray-300">
                          {selectedEvent.logEntry.message || 'No message'}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Raw Data */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white text-sm">Raw Log Data</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-950 rounded-md p-3 overflow-x-auto max-h-64">
                      {selectedEvent.logEntry.isJson ? (
                        <JsonViewer data={selectedEvent.logEntry.data} />
                      ) : (
                        <pre className="font-mono text-xs text-gray-300 whitespace-pre-wrap">
                          {selectedEvent.logEntry.raw}
                        </pre>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Notes Section */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white text-sm">
                      Investigation Notes ({selectedEvent.annotations.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedEvent.annotations.map((annotation) => (
                        <AnnotationItem
                          key={annotation.id}
                          annotation={annotation}
                          onUpdate={(content) => updateAnnotation(selectedEvent.id, annotation.id, content)}
                          onRemove={() => removeAnnotation(selectedEvent.id, annotation.id)}
                        />
                      ))}
                      
                      <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700/50 border-dashed">
                        <Input
                          placeholder="Add a new investigation note..."
                          className="bg-gray-800 border-gray-600 text-gray-200 mb-2"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                              addAnnotation(selectedEvent.id, e.currentTarget.value.trim());
                              e.currentTarget.value = '';
                            }
                          }}
                        />
                        <p className="text-xs text-gray-500">Press Enter to add note</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <AlertCircle className="w-16 h-16 text-gray-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-400 mb-2">Select an Event</h3>
                <p className="text-sm text-gray-500 max-w-md">
                  Click on any event from the timeline on the left to view its details and add investigation notes.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Export Dialog */}
      <AnimatePresence>
        {showExportDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-60 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-md w-full mx-4"
            >
              <h3 className="text-lg font-semibold text-white mb-4">Export Investigation Report</h3>
              <p className="text-sm text-gray-400 mb-6">
                Choose the format for your investigation report containing {events.length} events.
              </p>
              
              <div className="flex gap-3">
                <Button
                  onClick={() => handleExport('markdown')}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Export as Markdown
                </Button>
                <Button
                  onClick={() => handleExport('json')}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white"
                >
                  Export as JSON
                </Button>
              </div>
              
              <Button
                variant="ghost"
                onClick={() => setShowExportDialog(false)}
                className="w-full mt-3 text-gray-400 hover:text-white"
              >
                Cancel
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
