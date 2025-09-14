import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, 
  ChevronRight, 
  X, 
  Plus, 
  Edit3, 
  Trash2, 
  GripVertical,
  Copy,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '../../../../../components/ui/card';
import { Button } from '../../../../../components/ui/button';
import { Input } from '../../../../../components/ui/input';
import { TimelineEvent, TimelineAnnotation } from '../../../../types/timeline';
import { LogLevel } from '../../../../types';
import { LOG_LEVEL_COLORS } from '../../../../constants';

interface TimelineCardProps {
  event: TimelineEvent;
  onRemove: (eventId: string) => void;
  onAddAnnotation: (eventId: string, content: string) => void;
  onUpdateAnnotation: (eventId: string, annotationId: string, content: string) => void;
  onRemoveAnnotation: (eventId: string, annotationId: string) => void;
  isSelected?: boolean;
  onSelect?: (eventId: string) => void;
  isDragging?: boolean;
  dragHandleProps?: any;
  onReorder?: (draggedId: string, targetId: string) => void;
}

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

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
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

const AnnotationItem = ({ 
  annotation, 
  onUpdate, 
  onRemove 
}: { 
  annotation: TimelineAnnotation;
  onUpdate: (content: string) => void;
  onRemove: () => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(annotation.content);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (content.trim() && content !== annotation.content) {
      onUpdate(content.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setContent(annotation.content);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
      <div className="flex items-start justify-between gap-2">
        {isEditing ? (
          <Input
            ref={inputRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="flex-1 text-sm bg-gray-900 border-gray-600"
            placeholder="Add your note..."
          />
        ) : (
          <p className="flex-1 text-sm text-gray-200 leading-relaxed">
            {annotation.content}
          </p>
        )}
        <div className="flex gap-1">
          {!isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="h-6 w-6 p-0 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white"
            >
              <Edit3 className="w-3 h-3" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="h-6 w-6 p-0 bg-red-900/20 hover:bg-red-800/30 text-red-400 hover:text-red-300"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
      <div className="text-xs text-gray-500 mt-2">
        {annotation.updatedAt.toLocaleString()}
      </div>
    </div>
  );
};

export default function TimelineCard({
  event,
  onRemove,
  onAddAnnotation,
  onUpdateAnnotation,
  onRemoveAnnotation,
  isSelected = false,
  onSelect,
  isDragging = false,
  dragHandleProps,
  onReorder
}: TimelineCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAddingAnnotation, setIsAddingAnnotation] = useState(false);
  const [newAnnotation, setNewAnnotation] = useState('');
  const annotationInputRef = useRef<HTMLInputElement>(null);

  const { logEntry, annotations } = event;
  const levelName = logEntry.level || 'NO_LEVEL';
  const levelColor = LOG_LEVEL_COLORS[levelName];

  useEffect(() => {
    if (isAddingAnnotation && annotationInputRef.current) {
      annotationInputRef.current.focus();
    }
  }, [isAddingAnnotation]);

  const handleAddAnnotation = () => {
    if (newAnnotation.trim()) {
      onAddAnnotation(event.id, newAnnotation.trim());
      setNewAnnotation('');
      setIsAddingAnnotation(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddAnnotation();
    } else if (e.key === 'Escape') {
      setNewAnnotation('');
      setIsAddingAnnotation(false);
    }
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
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
      className={`relative ${isDragging ? 'opacity-50' : ''}`}
      draggable={!!onReorder}
      onDragStartCapture={handleCardDragStart}
      onDragOver={handleCardDragOver}
      onDrop={handleCardDrop}
    >
      <Card 
        className={`bg-gray-800 border-gray-700 hover:border-gray-600 transition-all duration-200 ${
          isSelected ? 'ring-2 ring-blue-500' : ''
        } ${onReorder ? 'cursor-move' : ''}`}
        onClick={() => onSelect?.(event.id)}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing">
                <GripVertical className="w-4 h-4 text-gray-500" />
              </div>
              
              <span className={`px-2 py-1 text-xs font-bold rounded flex-shrink-0 ${
                levelName === 'ERROR' ? 'bg-red-500/20 text-red-300' :
                levelName === 'WARN' ? 'bg-yellow-500/20 text-yellow-300' :
                levelName === 'INFO' ? 'bg-blue-500/20 text-blue-300' :
                levelName === 'DEBUG' ? 'bg-gray-500/20 text-gray-400' :
                'bg-white/20 text-white'
              }`}>
                {levelName}
              </span>
              
              <span className="text-gray-400 font-mono text-xs flex-shrink-0">
                {formatTime(logEntry.timestamp)}
              </span>
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-6 w-6 p-0 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white"
              >
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove(event.id)}
                className="h-6 w-6 p-0 bg-red-900/20 hover:bg-red-800/30 text-red-400 hover:text-red-300"
              >
                <X className="w-4 h-4" />
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
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-gray-300 font-medium text-xs">Log Details</h4>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyToClipboard(logEntry.raw)}
                          className="h-6 w-6 p-0 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyToClipboard(JSON.stringify(logEntry.data, null, 2))}
                          className="h-6 w-6 p-0 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs mb-2 pb-2 border-b border-gray-700">
                      <div>
                        <span className="text-gray-500">Timestamp:</span>
                        <div className="font-mono text-gray-300 mt-1">
                          {formatTime(logEntry.timestamp)}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">Level:</span>
                        <div className="font-mono text-gray-300 mt-1">
                          <span className={`px-2 py-1 text-xs font-bold rounded ${
                            logEntry.level === LogLevel.ERROR ? 'bg-red-500/20 text-red-300' :
                            logEntry.level === LogLevel.WARN ? 'bg-yellow-500/20 text-yellow-300' :
                            logEntry.level === LogLevel.INFO ? 'bg-blue-500/20 text-blue-300' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {levelName}
                          </span>
                        </div>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-500">Message:</span>
                        <div className="font-mono text-gray-300 mt-1 break-words">
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
                        <Plus className="w-3 h-3 mr-1" />
                        Add Note
                      </Button>
                    </div>

                    <div className="space-y-1">
                      {annotations.map((annotation) => (
                        <AnnotationItem
                          key={annotation.id}
                          annotation={annotation}
                          onUpdate={(content) => onUpdateAnnotation(event.id, annotation.id, content)}
                          onRemove={() => onRemoveAnnotation(event.id, annotation.id)}
                        />
                      ))}

                      {isAddingAnnotation && (
                        <div className="bg-gray-800/50 rounded-lg p-2 border border-gray-700/50">
                          <Input
                            ref={annotationInputRef}
                            value={newAnnotation}
                            onChange={(e) => setNewAnnotation(e.target.value)}
                            onBlur={handleAddAnnotation}
                            onKeyDown={handleKeyDown}
                            className="text-sm bg-gray-900 border-gray-600"
                            placeholder="Add your note (e.g., 'retry triggered here', 'unexpected null here')..."
                          />
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
