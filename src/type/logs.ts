export enum LogLevel {
    ERROR = 'ERROR',
    WARN = 'WARN',
    INFO = 'INFO',
    DEBUG = 'DEBUG'
}

export interface LogEntry {
    id: number
    level: LogLevel
    timestamp: string
    message: string
    data: unknown
    raw: string
    isJson: boolean
}