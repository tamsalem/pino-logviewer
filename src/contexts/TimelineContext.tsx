import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { LogEntry } from '../types';
import { TimelineEvent, TimelineState, TimelineAnnotation } from '../types/timeline';

interface TimelineContextType {
  state: TimelineState;
  addEvent: (logEntry: LogEntry) => void;
  removeEvent: (eventId: string) => void;
  reorderEvents: (eventIds: string[]) => void;
  addAnnotation: (eventId: string, content: string) => void;
  updateAnnotation: (eventId: string, annotationId: string, content: string) => void;
  removeAnnotation: (eventId: string, annotationId: string) => void;
  togglePanel: () => void;
  toggleCaseboardMode: () => void;
  selectEvent: (eventId: string | null) => void;
  clearTimeline: () => void;
}

type TimelineAction =
  | { type: 'ADD_EVENT'; payload: LogEntry }
  | { type: 'REMOVE_EVENT'; payload: string }
  | { type: 'REORDER_EVENTS'; payload: string[] }
  | { type: 'ADD_ANNOTATION'; payload: { eventId: string; content: string } }
  | { type: 'UPDATE_ANNOTATION'; payload: { eventId: string; annotationId: string; content: string } }
  | { type: 'REMOVE_ANNOTATION'; payload: { eventId: string; annotationId: string } }
  | { type: 'TOGGLE_PANEL' }
  | { type: 'TOGGLE_CASEBOARD_MODE' }
  | { type: 'SELECT_EVENT'; payload: string | null }
  | { type: 'CLEAR_TIMELINE' };

const initialState: TimelineState = {
  events: [],
  isPanelOpen: false,
  isCaseboardMode: false,
  selectedEventId: null,
};

function timelineReducer(state: TimelineState, action: TimelineAction): TimelineState {
  switch (action.type) {
    case 'ADD_EVENT': {
      const logEntry = action.payload;
      const newEvent: TimelineEvent = {
        id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        logEntry,
        annotations: [],
        order: state.events.length,
        addedAt: new Date(),
      };
      return {
        ...state,
        events: [...state.events, newEvent],
      };
    }

    case 'REMOVE_EVENT': {
      return {
        ...state,
        events: state.events.filter(event => event.id !== action.payload),
        selectedEventId: state.selectedEventId === action.payload ? null : state.selectedEventId,
      };
    }

    case 'REORDER_EVENTS': {
      const eventIds = action.payload;
      const reorderedEvents = eventIds.map((id, index) => {
        const event = state.events.find(e => e.id === id);
        return event ? { ...event, order: index } : null;
      }).filter(Boolean) as TimelineEvent[];
      
      return {
        ...state,
        events: reorderedEvents,
      };
    }

    case 'ADD_ANNOTATION': {
      const { eventId, content } = action.payload;
      const newAnnotation: TimelineAnnotation = {
        id: `annotation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        content,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return {
        ...state,
        events: state.events.map(event =>
          event.id === eventId
            ? { ...event, annotations: [...event.annotations, newAnnotation] }
            : event
        ),
      };
    }

    case 'UPDATE_ANNOTATION': {
      const { eventId, annotationId, content } = action.payload;
      return {
        ...state,
        events: state.events.map(event =>
          event.id === eventId
            ? {
                ...event,
                annotations: event.annotations.map(annotation =>
                  annotation.id === annotationId
                    ? { ...annotation, content, updatedAt: new Date() }
                    : annotation
                ),
              }
            : event
        ),
      };
    }

    case 'REMOVE_ANNOTATION': {
      const { eventId, annotationId } = action.payload;
      return {
        ...state,
        events: state.events.map(event =>
          event.id === eventId
            ? {
                ...event,
                annotations: event.annotations.filter(annotation => annotation.id !== annotationId),
              }
            : event
        ),
      };
    }

    case 'TOGGLE_PANEL':
      return {
        ...state,
        isPanelOpen: !state.isPanelOpen,
      };

    case 'TOGGLE_CASEBOARD_MODE':
      return {
        ...state,
        isCaseboardMode: !state.isCaseboardMode,
        isPanelOpen: false, // Close panel when entering caseboard mode
      };

    case 'SELECT_EVENT':
      return {
        ...state,
        selectedEventId: action.payload,
      };

    case 'CLEAR_TIMELINE':
      return {
        ...state,
        events: [],
        selectedEventId: null,
      };

    default:
      return state;
  }
}

const TimelineContext = createContext<TimelineContextType | undefined>(undefined);

export function TimelineProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(timelineReducer, initialState);

  const addEvent = (logEntry: LogEntry) => {
    dispatch({ type: 'ADD_EVENT', payload: logEntry });
  };

  const removeEvent = (eventId: string) => {
    dispatch({ type: 'REMOVE_EVENT', payload: eventId });
  };

  const reorderEvents = (eventIds: string[]) => {
    dispatch({ type: 'REORDER_EVENTS', payload: eventIds });
  };

  const addAnnotation = (eventId: string, content: string) => {
    dispatch({ type: 'ADD_ANNOTATION', payload: { eventId, content } });
  };

  const updateAnnotation = (eventId: string, annotationId: string, content: string) => {
    dispatch({ type: 'UPDATE_ANNOTATION', payload: { eventId, annotationId, content } });
  };

  const removeAnnotation = (eventId: string, annotationId: string) => {
    dispatch({ type: 'REMOVE_ANNOTATION', payload: { eventId, annotationId } });
  };

  const togglePanel = () => {
    dispatch({ type: 'TOGGLE_PANEL' });
  };

  const toggleCaseboardMode = () => {
    dispatch({ type: 'TOGGLE_CASEBOARD_MODE' });
  };

  const selectEvent = (eventId: string | null) => {
    dispatch({ type: 'SELECT_EVENT', payload: eventId });
  };

  const clearTimeline = () => {
    dispatch({ type: 'CLEAR_TIMELINE' });
  };

  const value: TimelineContextType = {
    state,
    addEvent,
    removeEvent,
    reorderEvents,
    addAnnotation,
    updateAnnotation,
    removeAnnotation,
    togglePanel,
    toggleCaseboardMode,
    selectEvent,
    clearTimeline,
  };

  return (
    <TimelineContext.Provider value={value}>
      {children}
    </TimelineContext.Provider>
  );
}

export function useTimeline() {
  const context = useContext(TimelineContext);
  if (context === undefined) {
    throw new Error('useTimeline must be used within a TimelineProvider');
  }
  return context;
}
