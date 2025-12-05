import { useCallback, useState } from 'react';
import { UploadCloud } from 'lucide-react';
import { motion } from 'framer-motion';
import { type LogEntry, LogLevel } from '../../../types';
import { parseLogText } from '../../../utils';

export default function LogUploader({ onFileUpload }: { onFileUpload: (_:any) => void }) {
  const [isDragging, setIsDragging] = useState(false);

  const parseLogFile = (fileContent: string) : LogEntry[] => parseLogText(fileContent);

  const handleFile = useCallback((file:any) => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const entries = parseLogFile(e?.target?.result as string);
        onFileUpload({ entries, name: file?.name });
      };
      reader.readAsText(file);
    }
  }, [onFileUpload]);

  const handleDrop = useCallback((event: any) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      handleFile(event.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleDrag = useCallback((event: any) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.type === "dragenter" || event.type === "dragover") {
      setIsDragging(true);
    } else if (event.type === "dragleave") {
      setIsDragging(false);
    }
  }, []);

  const handleFileChange = (event: any) => {
    if (event.target.files && event.target.files[0]) {
      handleFile(event.target.files[0]);
    }
  };

  return (
    <motion.div
      className="relative group w-full p-8 border-2 border-dashed rounded-xl text-center cursor-pointer transition-colors duration-300"
      style={{
        borderColor: isDragging ? 'var(--logviewer-accent-primary)' : 'var(--logviewer-border-primary)',
        backgroundColor: isDragging ? 'var(--logviewer-bg-secondary)' : 'transparent'
      }}
      onDrop={handleDrop}
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onClick={() => { document?.getElementById('file-upload-input')?.click() }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <input
        type="file"
        id="file-upload-input"
        className="hidden"
        accept=".log"
        onChange={handleFileChange}
      />
      <div className="flex flex-col items-center justify-center space-y-4">
        <UploadCloud
          className="h-12 w-12 transition-colors duration-300"
          style={{ color: isDragging ? 'var(--logviewer-accent-primary)' : 'var(--logviewer-text-secondary)' }}
        />
        <p className="text-lg font-medium" style={{ color: 'var(--logviewer-text-primary)' }}>
          <span style={{ color: 'var(--logviewer-accent-primary)' }}>Click to upload</span> or drag and drop a .log file
        </p>
      </div>
    </motion.div>
  );
}