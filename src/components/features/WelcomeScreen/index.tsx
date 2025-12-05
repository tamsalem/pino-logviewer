import LogUploader from '../LogUploader';
import LogPaste from '../LogPaste';

export default function WelcomeScreen({ onFileUpload } : { onFileUpload: (_:any) => void }) {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold tracking-tighter sm:text-5xl" style={{ color: 'var(--logviewer-text-inverse)' }}>
          Analyze Your Logs Instantly
        </h2>
        <p className="mt-4 text-lg" style={{ color: 'var(--logviewer-text-secondary)' }}>
          Drag and drop a Pino .log/.txt file to get started.
        </p>
      </div>

      <LogUploader onFileUpload={onFileUpload} />
      <LogPaste onLogsParsed={onFileUpload} />
    </div>
  );
}