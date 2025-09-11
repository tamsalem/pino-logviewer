import { LogEntry, LogLevel } from '../types/logs';
export const parseLogText = (content: string): LogEntry[] => {
    const out: LogEntry[] = [];
    const lines = content.split(/\r?\n/);
    let id = 0;

    const toLevel = (lvl: unknown): LogLevel => {
        if (typeof lvl === 'number') {
            if (lvl >= 50) return LogLevel.ERROR; // error/fatal
            if (lvl >= 40) return LogLevel.WARN;
            if (lvl >= 20) return LogLevel.DEBUG;
        }
        if (typeof lvl === 'string') {
            const up = lvl.toUpperCase();
            if (up === 'ERROR' || up === 'FATAL') return LogLevel.ERROR;
            if (up === 'WARN' || up === 'WARNING') return LogLevel.WARN;
            if (up === 'DEBUG' || up === 'TRACE') return LogLevel.DEBUG;
        }
        return LogLevel.INFO;
    };

    const first = (...v: any[]) => v.find(x => x !== undefined && x !== null);

    const pushJson = (raw: string, parsed: any) => {
        const ts = first(parsed.time, parsed.timestamp, parsed.ts, new Date().toISOString());
        const msg = first(parsed.msg, parsed.message, 'No message');
        out.push({
            id: id++,
            level: toLevel(parsed.level),
            timestamp: typeof ts === 'number' ? new Date(ts).toISOString() : String(ts),
            message: String(msg),
            data: parsed,
            raw,
            isJson: true,
        });
    };

    const pushText = (raw: string) => {
        out.push({
            id: id++,
            level: LogLevel.INFO,
            timestamp: new Date().toISOString(),
            message: raw,
            data: { message: raw },
            raw,
            isJson: false,
        });
    };

    let i = 0;
    while (i < lines.length) {
        const raw = lines[i];
        const trimmed = raw?.trim();
        if (!trimmed) { i++; continue; }

        // try strict one-line JSON first
        try {
            const parsed = JSON.parse(raw);
            pushJson(raw, parsed);
            i++;
        } catch {
            // not JSON on this line → accumulate a broken block until the next *new* JSON entry
            let buf = raw;
            let j = i + 1;

            while (j < lines.length) {
                const t = lines[j].trim();

                // stop when the next line clearly starts a new JSON entry
                // (beginning of '{' is enough; ',"...' etc. is a continuation)
                if (t.startsWith('{')) break;

                // otherwise treat as continuation of the broken chunk
                buf += '\n' + lines[j];
                j++;
            }

            // single plain-text entry for the whole broken block
            pushText(buf);
            i = j;
        }
    }

    return out;
};
