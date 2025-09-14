import { TimelineEvent, TimelineExportOptions, InvestigationReport } from '../types/timeline';

/**
 * Export timeline events to Markdown format
 */
export function exportTimelineToMarkdown(events: TimelineEvent[], options: TimelineExportOptions): void {
  if (events.length === 0) {
    alert('No timeline events to export');
    return;
  }

  const sortedEvents = [...events].sort((a, b) => 
    new Date(a.logEntry.timestamp).getTime() - new Date(b.logEntry.timestamp).getTime()
  );

  const timeRange = getTimeRange(events);
  const filename = options.filename || `investigation-report-${new Date().toISOString().split('T')[0]}.md`;

  let markdown = `# Investigation Report\n\n`;
  
  // Metadata
  markdown += `**Generated:** ${new Date().toLocaleString()}\n`;
  markdown += `**Total Events:** ${events.length}\n`;
  if (timeRange) {
    markdown += `**Time Range:** ${timeRange.start.toLocaleString()} - ${timeRange.end.toLocaleString()}\n`;
  }
  markdown += `\n---\n\n`;

  // Summary
  const errorCount = events.filter(e => e.logEntry.level === 'ERROR').length;
  const warnCount = events.filter(e => e.logEntry.level === 'WARN').length;
  const infoCount = events.filter(e => e.logEntry.level === 'INFO').length;
  const debugCount = events.filter(e => e.logEntry.level === 'DEBUG').length;

  markdown += `## Summary\n\n`;
  markdown += `- **Errors:** ${errorCount}\n`;
  markdown += `- **Warnings:** ${warnCount}\n`;
  markdown += `- **Info:** ${infoCount}\n`;
  markdown += `- **Debug:** ${debugCount}\n\n`;

  // Timeline
  markdown += `## Timeline\n\n`;
  
  sortedEvents.forEach((event, index) => {
    const { logEntry, annotations } = event;
    const timestamp = new Date(logEntry.timestamp);
    
    markdown += `### Event ${index + 1}: ${logEntry.level} - ${timestamp.toLocaleString()}\n\n`;
    
    // Basic info
    markdown += `**Level:** \`${logEntry.level}\`\n`;
    markdown += `**Timestamp:** \`${logEntry.timestamp}\`\n`;
    markdown += `**Message:** ${logEntry.message || 'No message'}\n\n`;
    
    // Annotations
    if (options.includeAnnotations && annotations.length > 0) {
      markdown += `**Notes:**\n`;
      annotations.forEach((annotation, annIndex) => {
        markdown += `${annIndex + 1}. ${annotation.content}\n`;
        markdown += `   - *Added: ${annotation.createdAt.toLocaleString()}*\n`;
      });
      markdown += `\n`;
    }
    
    // Raw data
    if (options.includeRawData) {
      markdown += `**Raw Data:**\n`;
      markdown += `\`\`\`json\n`;
      markdown += `${JSON.stringify(logEntry.data, null, 2)}\n`;
      markdown += `\`\`\`\n\n`;
    }
    
    markdown += `---\n\n`;
  });

  // Download the file
  downloadFile(markdown, filename, 'text/markdown');
}

/**
 * Export timeline events to JSON format
 */
export function exportTimelineToJSON(events: TimelineEvent[], options: TimelineExportOptions): void {
  if (events.length === 0) {
    alert('No timeline events to export');
    return;
  }

  const sortedEvents = [...events].sort((a, b) => 
    new Date(a.logEntry.timestamp).getTime() - new Date(b.logEntry.timestamp).getTime()
  );

  const timeRange = getTimeRange(events);
  const filename = options.filename || `investigation-report-${new Date().toISOString().split('T')[0]}.json`;

  const report: InvestigationReport = {
    metadata: {
      title: 'Investigation Report',
      createdAt: new Date(),
      totalEvents: events.length,
      timeRange: timeRange || { start: new Date(), end: new Date() },
    },
    events: sortedEvents,
    summary: generateSummary(events),
  };

  const jsonContent = JSON.stringify(report, null, 2);
  downloadFile(jsonContent, filename, 'application/json');
}

/**
 * Get time range from events
 */
function getTimeRange(events: TimelineEvent[]): { start: Date; end: Date } | null {
  if (events.length === 0) return null;
  
  const timestamps = events.map(event => new Date(event.logEntry.timestamp));
  const start = new Date(Math.min(...timestamps.map(t => t.getTime())));
  const end = new Date(Math.max(...timestamps.map(t => t.getTime())));
  
  return { start, end };
}

/**
 * Generate a summary of the investigation
 */
function generateSummary(events: TimelineEvent[]): string {
  const errorCount = events.filter(e => e.logEntry.level === 'ERROR').length;
  const warnCount = events.filter(e => e.logEntry.level === 'WARN').length;
  const totalAnnotations = events.reduce((sum, event) => sum + event.annotations.length, 0);
  
  let summary = `Investigation contains ${events.length} events`;
  
  if (errorCount > 0) {
    summary += ` with ${errorCount} error(s)`;
  }
  
  if (warnCount > 0) {
    summary += ` and ${warnCount} warning(s)`;
  }
  
  if (totalAnnotations > 0) {
    summary += `. ${totalAnnotations} annotation(s) added for context.`;
  }
  
  return summary;
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
