import { LogEntry } from './logs';

export interface TimelineAnnotation {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TimelineEvent {
  id: string;
  logEntry: LogEntry;
  annotations: TimelineAnnotation[];
  order: number; // For manual reordering
  addedAt: Date;
}

export interface TimelineState {
  events: TimelineEvent[];
  isPanelOpen: boolean;
  isCaseboardMode: boolean;
  selectedEventId: string | null;
}

export interface TimelineExportOptions {
  format: 'markdown' | 'json';
  includeAnnotations: boolean;
  includeRawData: boolean;
  filename?: string;
}

export interface InvestigationReport {
  metadata: {
    title: string;
    createdAt: Date;
    totalEvents: number;
    timeRange: {
      start: Date;
      end: Date;
    };
  };
  events: TimelineEvent[];
  summary?: string;
}
