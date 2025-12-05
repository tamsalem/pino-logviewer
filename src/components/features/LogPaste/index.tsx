import React, { useState, useCallback } from 'react';
import { Clipboard } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../../../../components/ui';
import { LogEntry, LogLevel } from '../../../types';
import { parseLogText } from '../../../utils';
import { electronAPI } from '../../../utils';

export default function LogPaste({ onLogsParsed }: { onLogsParsed: (_:any) => void }) {
    const [text, setText] = useState('');
    const [error, setError] = useState<string | null>(null);

    const parseLog = useCallback((content: string): LogEntry[] => {
        return parseLogText(content)
    }, []);

    const handleParse = async () => {
        try {
            const entries = parseLog(text);
            if (entries.length === 0) {
                setError('No valid logs detected');
                return;
            }
            
            // Save to history
            try {
                await electronAPI.saveHistory(entries);
            } catch (err) {
                console.warn('Failed to save to history:', err);
            }
            
            onLogsParsed({ entries, name: 'pasted-logs' });
        } catch (err) {
            setError('Failed to parse pasted logs');
        }
    };

    return (
        <motion.div
            className="mt-8 p-6 border-2 border-dashed rounded-xl"
            style={{ borderColor: 'var(--logviewer-border-primary)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <div className="flex items-center gap-2 mb-4" style={{ color: 'var(--logviewer-text-primary)' }}>
                <Clipboard className="w-5 h-5" style={{ color: 'var(--logviewer-accent-primary)' }} />
                <span className="font-medium">Paste Logs</span>
            </div>
            <textarea
                rows={6}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste your raw or JSON logs here..."
                className="w-full p-3 rounded font-mono text-sm resize-y"
                style={{
                    backgroundColor: 'var(--logviewer-bg-secondary)',
                    border: `1px solid var(--logviewer-border-primary)`,
                    color: 'var(--logviewer-text-primary)'
                }}
            />
            {error && <p className="mt-2 text-sm" style={{ color: 'var(--logviewer-error-text)' }}>{error}</p>}
            <div className="mt-3 flex justify-end">
                <Button
                    variant="outline"
                    size="sm"
                    disabled={!text.trim()}
                    onClick={handleParse}
                    className="border"
                    style={{
                        color: 'var(--logviewer-text-primary)',
                        backgroundColor: 'var(--logviewer-bg-secondary)',
                        borderColor: 'var(--logviewer-border-primary)'
                    }}
                >
                    Parse
                </Button>
            </div>
        </motion.div>
    );
}
