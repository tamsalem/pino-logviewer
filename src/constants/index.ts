// Log level constants
export const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG',
  NO_LEVEL: 'NO_LEVEL',
} as const;

// Log level options for UI
export const LOG_LEVEL_OPTIONS = [
  { value: 'ERROR', label: 'Error', color: 'bg-red-500' },
  { value: 'WARN', label: 'Warn', color: 'bg-yellow-500' },
  { value: 'INFO', label: 'Info', color: 'bg-blue-500' },
  { value: 'DEBUG', label: 'Debug', color: 'bg-gray-500' },
  { value: 'NO_LEVEL', label: 'No Level', color: 'bg-white' },
] as const;

// Log level colors for styling
export const LOG_LEVEL_COLORS = {
  [LOG_LEVELS.ERROR]: 'bg-red-500/10 text-red-300 border-l-red-500',
  [LOG_LEVELS.WARN]: 'bg-yellow-500/10 text-yellow-300 border-l-yellow-500',
  [LOG_LEVELS.INFO]: 'bg-blue-500/10 text-blue-300 border-l-blue-500',
  [LOG_LEVELS.DEBUG]: 'bg-green-500/10 text-green-300 border-l-green-500',
} as const;

// Sort order options
export const SORT_ORDER = {
  ASC: 'asc',
  DESC: 'desc',
} as const;

// LLM providers
export const LLM_PROVIDERS = {
  NONE: 'none',
  OLLAMA: 'ollama',
} as const;

// API endpoints
export const API_ENDPOINTS = {
  OLLAMA_TAGS: 'http://localhost:11434/api/tags',
} as const;

// Search debounce delay
export const SEARCH_DEBOUNCE_DELAY = 400;

// Default filter levels
export const DEFAULT_FILTER_LEVELS = [
  LOG_LEVELS.ERROR,
  LOG_LEVELS.WARN,
  LOG_LEVELS.INFO,
  LOG_LEVELS.DEBUG,
  LOG_LEVELS.NO_LEVEL,
];

// Keyboard shortcuts
export const KEYBOARD_SHORTCUTS = [
  {
    category: 'Search',
    shortcuts: [
      { keys: ['Cmd/Ctrl', 'F'], description: 'Focus search input' },
      { keys: ['Enter'], description: 'Next search result' },
      { keys: ['F3'], description: 'Next search result' },
      { keys: ['Shift', 'F3'], description: 'Previous search result' },
    ],
  },
  {
    category: 'Navigation',
    shortcuts: [
      { keys: ['PageUp'], description: 'Scroll to top' },
      { keys: ['PageDown'], description: 'Scroll to bottom' },
    ],
  },
] as const;
