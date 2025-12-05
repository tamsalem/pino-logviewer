import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, BarChart3, Clock, Info } from 'lucide-react';
import { Badge, Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui';
import { LogEntry, LogLevel } from '../../../types';

// Consistent level colors using CSS variables
const getLevelStyles = (level: string) => {
  switch (level) {
    case 'ERROR':
      return {
        bg: 'var(--logviewer-error-bg)',
        text: 'var(--logviewer-error-text)',
        border: 'var(--logviewer-error-border)'
      };
    case 'WARN':
      return {
        bg: 'var(--logviewer-warn-bg)',
        text: 'var(--logviewer-warn-text)',
        border: 'var(--logviewer-warn-border)'
      };
    case 'INFO':
      return {
        bg: 'var(--logviewer-info-bg)',
        text: 'var(--logviewer-info-text)',
        border: 'var(--logviewer-info-border)'
      };
    case 'DEBUG':
      return {
        bg: 'var(--logviewer-debug-bg)',
        text: 'var(--logviewer-debug-text)',
        border: 'var(--logviewer-debug-border)'
      };
    default:
      return {
        bg: 'var(--logviewer-no-level-bg)',
        text: 'var(--logviewer-no-level-text)',
        border: 'var(--logviewer-no-level-border)'
      };
  }
};

export default function LogDashboard({ entries }: { entries: LogEntry[] }) {
    const analytics = useMemo(() => {
        const levelCounts: Partial<Record<LogLevel, number>> = {};
        const timeDistribution: Record<number, number> = {};
        let totalLogs = entries.length;
        let errorCount = 0;
        let warnCount = 0;

        // Get time range
        const times = entries.map(e => new Date(e.timestamp).getTime());
        const minTime = times.length > 0 ? new Date(Math.min(...times)).getTime() : null;
        const maxTime = times.length > 0 ? new Date(Math.max(...times)).getTime() : null;
        const timeSpan = minTime && maxTime ? maxTime - minTime : 0;

        entries.forEach(entry => {
            // Level distribution
            const levelName = entry.level || LogLevel.INFO;
            levelCounts[levelName] = (levelCounts[levelName] || 0) + 1;

            // Error and warning counts
            if (levelName === LogLevel.ERROR) errorCount++;
            if (levelName === LogLevel.WARN) warnCount++;

            // Time distribution (hourly buckets)
            const hour = new Date(entry.timestamp).getHours();
            timeDistribution[hour] = (timeDistribution[hour] || 0) + 1;
        });

        // Top error messages
        const errorMessages = entries
        .filter(entry => [LogLevel.ERROR,LogLevel.WARN].includes(entry.level))
        .reduce((acc, entry) => {
            const msg = entry.message.substring(0, 50) + (entry.message.length > 50 ? '...' : '');
            // @ts-ignore
            acc[msg] = (acc[msg] || 0) + 1;
            return acc;
        }, {});

        // @ts-ignore
        const topErrorMessages = Object.entries(errorMessages)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 5) as [string,number][];

        // Peak hours
        const peakHour = Object.entries(timeDistribution)
        .sort(([,a], [,b]) => b - a)[0];

        return {
            totalLogs,
            levelCounts,
            errorCount,
            warnCount,
            timeSpan,
            minTime,
            maxTime,
            topErrorMessages,
            peakHour: peakHour ? [parseInt(peakHour[0]), peakHour[1]] : null,
            timeDistribution,
        };
    }, [entries]);

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4"
            style={{ 
              backgroundColor: 'var(--logviewer-bg-secondary)', 
              borderBottom: `1px solid var(--logviewer-border-primary)` 
            }}
        >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {/* Total Logs */}
                <Card 
                  className="border"
                  style={{ 
                    backgroundColor: 'var(--logviewer-bg-tertiary)', 
                    borderColor: 'var(--logviewer-border-primary)' 
                  }}
                >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium" style={{ color: 'var(--logviewer-text-primary)' }}>Total Logs</CardTitle>
                        <BarChart3 className="h-4 w-4" style={{ color: 'var(--logviewer-text-secondary)' }} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold" style={{ color: 'var(--logviewer-text-inverse)' }}>{analytics.totalLogs.toLocaleString()}</div>
                        {analytics.timeSpan > 0 && (
                            <p className="text-xs" style={{ color: 'var(--logviewer-text-secondary)' }}>
                                Over {Math.round(analytics.timeSpan / 1000 / 60)} minutes
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Error Rate */}
                <Card 
                  className="border"
                  style={{ 
                    backgroundColor: 'var(--logviewer-bg-tertiary)', 
                    borderColor: 'var(--logviewer-border-primary)' 
                  }}
                >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium" style={{ color: 'var(--logviewer-text-primary)' }}>Errors</CardTitle>
                        <AlertTriangle className="h-4 w-4" style={{ color: 'var(--logviewer-error-text)' }} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold" style={{ color: 'var(--logviewer-error-text)' }}>{analytics.errorCount}</div>
                        <p className="text-xs" style={{ color: 'var(--logviewer-text-secondary)' }}>
                            {analytics.totalLogs > 0 ? ((analytics.errorCount / analytics.totalLogs) * 100).toFixed(1) : 0}% of total
                        </p>
                    </CardContent>
                </Card>

                {/* Warnings */}
                <Card 
                  className="border"
                  style={{ 
                    backgroundColor: 'var(--logviewer-bg-tertiary)', 
                    borderColor: 'var(--logviewer-border-primary)' 
                  }}
                >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium" style={{ color: 'var(--logviewer-text-primary)' }}>Warnings</CardTitle>
                        <Info className="h-4 w-4" style={{ color: 'var(--logviewer-warn-text)' }} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold" style={{ color: 'var(--logviewer-warn-text)' }}>{analytics.warnCount}</div>
                        <p className="text-xs" style={{ color: 'var(--logviewer-text-secondary)' }}>
                            {analytics.totalLogs > 0 ? ((analytics.warnCount / analytics.totalLogs) * 100).toFixed(1) : 0}% of total
                        </p>
                    </CardContent>
                </Card>

                {/* Peak Hour */}
                <Card 
                  className="border"
                  style={{ 
                    backgroundColor: 'var(--logviewer-bg-tertiary)', 
                    borderColor: 'var(--logviewer-border-primary)' 
                  }}
                >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium" style={{ color: 'var(--logviewer-text-primary)' }}>Peak Hour</CardTitle>
                        <Clock className="h-4 w-4" style={{ color: 'var(--logviewer-accent-primary)' }} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold" style={{ color: 'var(--logviewer-accent-primary)' }}>
                            {analytics.peakHour ? `${analytics.peakHour[0]}:00` : 'N/A'}
                        </div>
                        <p className="text-xs" style={{ color: 'var(--logviewer-text-secondary)' }}>
                            {analytics.peakHour ? `${analytics.peakHour[1]} logs` : 'No data'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Level Distribution */}
                <Card 
                  className="border"
                  style={{ 
                    backgroundColor: 'var(--logviewer-bg-tertiary)', 
                    borderColor: 'var(--logviewer-border-primary)' 
                  }}
                >
                    <CardHeader>
                        <CardTitle className="text-sm font-medium" style={{ color: 'var(--logviewer-text-primary)' }}>Log Level Distribution</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {Object.entries(analytics.levelCounts)
                        .sort(([a], [b]) => parseInt(b) - parseInt(a))
                        .map(([level, count]) => {
                            const percentage = analytics.totalLogs > 0 ? (count / analytics.totalLogs * 100).toFixed(1) : 0;
                            const levelStyles = getLevelStyles(level as LogLevel);
                            return (
                                <div key={level} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Badge 
                                          className="px-2 py-1 text-xs font-bold rounded"
                                          style={{
                                            backgroundColor: levelStyles.bg,
                                            color: levelStyles.text
                                          }}
                                        >
                                            {level}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div 
                                          className="w-20 h-2 rounded-full overflow-hidden"
                                          style={{ backgroundColor: 'var(--logviewer-bg-primary)' }}
                                        >
                                            <div
                                                className="h-full"
                                                style={{ 
                                                  width: `${percentage}%`,
                                                  backgroundColor: levelStyles.border
                                                }}
                                            />
                                        </div>
                                        <span className="text-sm w-12 text-right" style={{ color: 'var(--logviewer-text-secondary)' }}>{count}</span>
                                        <span className="text-xs w-12 text-right" style={{ color: 'var(--logviewer-text-tertiary)' }}>{percentage}%</span>
                                    </div>
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>

                {/* Top Error Messages */}
                <Card 
                  className="border"
                  style={{ 
                    backgroundColor: 'var(--logviewer-bg-tertiary)', 
                    borderColor: 'var(--logviewer-border-primary)' 
                  }}
                >
                    <CardHeader>
                        <CardTitle className="text-sm font-medium" style={{ color: 'var(--logviewer-text-primary)' }}>Top Error Messages</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {analytics.topErrorMessages.length > 0 ? (
                            <div className="space-y-2">
                                {analytics.topErrorMessages.map(([message, count], index) => (
                                    <div 
                                      key={index} 
                                      className="flex items-center justify-between p-2 rounded"
                                      style={{ backgroundColor: 'var(--logviewer-bg-secondary)' }}
                                    >
                                        <code className="text-sm flex-grow truncate pr-2" title={message} style={{ color: 'var(--logviewer-text-primary)' }}>
                                            {message}
                                        </code>
                                        <Badge 
                                          variant="outline" 
                                          className="border"
                                          style={{ 
                                            color: 'var(--logviewer-error-text)', 
                                            borderColor: 'var(--logviewer-error-border)' 
                                          }}
                                        >
                                            {count}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm" style={{ color: 'var(--logviewer-text-secondary)' }}>No errors or warnings found</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </motion.div>
    );
}