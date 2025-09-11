
export interface LogEntry {
  level: string;
  timestamp: string;
  message: string;
  [key: string]: any;
}

export interface ExportOptions {
  filename?: string;
  includeMetadata?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

/**
 * Export logs to CSV format
 */
export function exportToCSV(logs: LogEntry[], options: ExportOptions = {}): void {
  if (logs.length === 0) {
    alert('No logs to export');
    return;
  }

  const filename = options.filename || `logs-${new Date().toISOString().split('T')[0]}.csv`;
  
  // Get all unique keys from all log entries
  const allKeys = new Set<string>();
  logs.forEach(log => {
    Object.keys(log).forEach(key => allKeys.add(key));
  });
  
  const headers = Array.from(allKeys);
  
  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...logs.map(log => 
      headers.map(header => {
        const value = log[header];
        // Escape CSV values that contain commas, quotes, or newlines
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || '';
      }).join(',')
    )
  ].join('\n');

  // Add metadata if requested
  let finalContent = csvContent;
  if (options.includeMetadata) {
    const metadata = [
      `# Log Export Metadata`,
      `# Export Date: ${new Date().toISOString()}`,
      `# Total Entries: ${logs.length}`,
      `# Date Range: ${options.dateRange ? `${options.dateRange.start.toISOString()} to ${options.dateRange.end.toISOString()}` : 'All logs'}`,
      `#`,
      csvContent
    ].join('\n');
    finalContent = metadata;
  }

  // Download the file
  downloadFile(finalContent, filename, 'text/csv');
}

/**
 * Export logs to JSON format
 */
export function exportToJSON(logs: LogEntry[], options: ExportOptions = {}): void {
  if (logs.length === 0) {
    alert('No logs to export');
    return;
  }

  const filename = options.filename || `logs-${new Date().toISOString().split('T')[0]}.json`;
  
  const exportData = {
    metadata: options.includeMetadata ? {
      exportDate: new Date().toISOString(),
      totalEntries: logs.length,
      dateRange: options.dateRange ? {
        start: options.dateRange.start.toISOString(),
        end: options.dateRange.end.toISOString()
      } : null
    } : undefined,
    logs
  };

  const jsonContent = JSON.stringify(exportData, null, 2);
  downloadFile(jsonContent, filename, 'application/json');
}


/**
 * Download a file with the given content
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Get filtered logs based on search and level filters
 */
export function getFilteredLogs(
  allLogs: LogEntry[],
  searchQuery: string,
  levelFilters: Record<string, boolean>
): LogEntry[] {
  return allLogs.filter(log => {
    // Apply level filter
    const logLevel = log.level || 'No Level';
    if (!levelFilters[logLevel]) {
      return false;
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const searchableText = [
        log.message,
        log.level,
        log.timestamp,
        ...Object.entries(log)
          .filter(([key]) => !['message', 'level', 'timestamp'].includes(key))
          .map(([, value]) => String(value))
      ].join(' ').toLowerCase();
      
      return searchableText.includes(query);
    }

    return true;
  });
}
