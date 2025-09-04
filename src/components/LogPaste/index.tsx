import React, { useState, useCallback } from 'react';
import { Clipboard } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../../../components/ui';
import { LogEntry, LogLevel } from '../../type/logs';
import { parseLogText } from '../../Utils';

export default function LogPaste({ onLogsParsed }: { onLogsParsed: (_:any) => void }) {
    const [text, setText] = useState('');
    const [error, setError] = useState<string | null>(null);

    const parseLog = useCallback((content: string): LogEntry[] => {
        return parseLogText(content)
    }, []);

    const handleParse = () => {
        try {
            const entries = parseLog(text);
            if (entries.length === 0) {
                setError('No valid logs detected');
                return;
            }
            onLogsParsed({ entries, name: 'pasted-logs' });
        } catch (err) {
            setError('Failed to parse pasted logs');
        }
    };

    return (
        <motion.div
            className="mt-8 p-6 border-2 border-dashed rounded-xl border-gray-700"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <div className="flex items-center gap-2 mb-4 text-gray-300">
                <Clipboard className="w-5 h-5 text-indigo-400" />
                <span className="font-medium">Paste Logs</span>
            </div>
            <textarea
                rows={6}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste your raw or JSON logs here..."
                className="w-full p-3 rounded bg-gray-900 border border-gray-700 text-gray-200 font-mono text-sm resize-y focus:ring-indigo-500 focus:border-indigo-500"
            />
            {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
            <div className="mt-3 flex justify-end">
                <Button
                    variant="outline"
                    size="sm"
                    disabled={!text.trim()}
                    onClick={handleParse}
                    className="text-gray-200 bg-gray-800 border-gray-700 hover:bg-gray-700"
                >
                    Parse
                </Button>
            </div>
        </motion.div>
    );
}
