import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, BarChart3, Clock, Info } from 'lucide-react';
import { Badge, Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui';
import { LogEntry, LogLevel } from '../../../types';
import { LOG_LEVEL_COLORS } from '../../../constants';

// Use level colors from constants
const levelColors = LOG_LEVEL_COLORS;

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

    // @ts-ignore
    // @ts-ignore
    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gray-800/50 border-b border-gray-700 p-4"
        >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {/* Total Logs */}
                <Card className="bg-gray-900/50 border-gray-700">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-300">Total Logs</CardTitle>
                        <BarChart3 className="h-4 w-4 text-gray-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{analytics.totalLogs.toLocaleString()}</div>
                        {analytics.timeSpan > 0 && (
                            <p className="text-xs text-gray-500">
                                Over {Math.round(analytics.timeSpan / 1000 / 60)} minutes
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Error Rate */}
                <Card className="bg-gray-900/50 border-gray-700">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-300">Errors</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-red-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-400">{analytics.errorCount}</div>
                        <p className="text-xs text-gray-500">
                            {analytics.totalLogs > 0 ? ((analytics.errorCount / analytics.totalLogs) * 100).toFixed(1) : 0}% of total
                        </p>
                    </CardContent>
                </Card>

                {/* Warnings */}
                <Card className="bg-gray-900/50 border-gray-700">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-300">Warnings</CardTitle>
                        <Info className="h-4 w-4 text-yellow-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-400">{analytics.warnCount}</div>
                        <p className="text-xs text-gray-500">
                            {analytics.totalLogs > 0 ? ((analytics.warnCount / analytics.totalLogs) * 100).toFixed(1) : 0}% of total
                        </p>
                    </CardContent>
                </Card>

                {/* Peak Hour */}
                <Card className="bg-gray-900/50 border-gray-700">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-300">Peak Hour</CardTitle>
                        <Clock className="h-4 w-4 text-indigo-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-indigo-400">
                            {analytics.peakHour ? `${analytics.peakHour[0]}:00` : 'N/A'}
                        </div>
                        <p className="text-xs text-gray-500">
                            {analytics.peakHour ? `${analytics.peakHour[1]} logs` : 'No data'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Level Distribution */}
                <Card className="bg-gray-900/50 border-gray-700">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-gray-300">Log Level Distribution</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {Object.entries(analytics.levelCounts)
                        .sort(([a], [b]) => parseInt(b) - parseInt(a))
                        .map(([level, count]) => {
                            const percentage = analytics.totalLogs > 0 ? (count / analytics.totalLogs * 100).toFixed(1) : 0;
                            return (
                                <div key={level} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Badge className={levelColors[level as LogLevel]}>
                                            {level}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${levelColors?.[level as LogLevel]?.split(' ')[0] || 'bg-gray-400'}`}
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                        <span className="text-sm text-gray-400 w-12 text-right">{count}</span>
                                        <span className="text-xs text-gray-500 w-12 text-right">{percentage}%</span>
                                    </div>
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>

                {/* Top Error Messages */}
                <Card className="bg-gray-900/50 border-gray-700">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-gray-300">Top Error Messages</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {analytics.topErrorMessages.length > 0 ? (
                            <div className="space-y-2">
                                {analytics.topErrorMessages.map(([message, count], index) => (
                                    <div key={index} className="flex items-center justify-between p-2 bg-gray-800/50 rounded">
                                        <code className="text-sm text-gray-300 flex-grow truncate pr-2" title={message}>
                                            {message}
                                        </code>
                                        <Badge variant="outline" className="text-red-400 border-red-400/30">
                                            {count}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm">No errors or warnings found</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </motion.div>
    );
}