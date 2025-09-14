import React from 'react';
import TimelinePanel from './TimelinePanel';
import Caseboard from './Caseboard';
import { useTimeline } from '../../../contexts/TimelineContext';
import { exportTimelineToMarkdown, exportTimelineToJSON } from '../../../utils/timeline-export';
import { TimelineExportOptions } from '../../../types/timeline';

interface TimelineBuilderProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TimelineBuilder({ isOpen, onClose }: TimelineBuilderProps) {
  const { state } = useTimeline();

  const handleExport = (options: TimelineExportOptions) => {
    if (options.format === 'markdown') {
      exportTimelineToMarkdown(state.events, options);
    } else {
      exportTimelineToJSON(state.events, options);
    }
  };

  // Show caseboard mode if enabled, otherwise show the regular panel
  if (state.isCaseboardMode) {
    return <Caseboard isOpen={isOpen} onClose={onClose} />;
  }
  
  return (
    <TimelinePanel
      isOpen={isOpen}
      onClose={onClose}
      onExport={handleExport}
    />
  );
}
