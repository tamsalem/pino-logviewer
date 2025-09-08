import LogUploader from '../LogUploader';
import LogPaste from '../LogPaste';
import { ListTodo, Search, FastForward } from 'lucide-react';

export default function WelcomeScreen({ onFileUpload } : { onFileUpload: (_:any) => void }) {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold tracking-tighter text-white sm:text-5xl">
          Analyze Your Logs Instantly
        </h2>
        <p className="mt-4 text-lg text-gray-400">
          Drag and drop a Pino .log/.txt file to get started.
        </p>
      </div>

      <LogUploader onFileUpload={onFileUpload} />
      <LogPaste onLogsParsed={onFileUpload} />

      <div className="mt-16">
        <h3 className="text-2xl font-semibold text-center text-white mb-8">Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center text-center p-6 bg-gray-800/50 rounded-lg">
            <div className="bg-indigo-500/10 p-3 rounded-full mb-4">
              <ListTodo className="w-8 h-8 text-indigo-400" />
            </div>
            <h4 className="text-lg font-medium text-white">Structured View</h4>
            <p className="mt-2 text-gray-400 text-sm">
              Each log entry is parsed and displayed in a clean, collapsible format.
            </p>
          </div>
          <div className="flex flex-col items-center text-center p-6 bg-gray-800/50 rounded-lg">
            <div className="bg-green-500/10 p-3 rounded-full mb-4">
              <Search className="w-8 h-8 text-green-400" />
            </div>
            <h4 className="text-lg font-medium text-white">Instant Search</h4>
            <p className="mt-2 text-gray-400 text-sm">
              Quickly filter thousands of lines by level or message content.
            </p>
          </div>
          <div className="flex flex-col items-center text-center p-6 bg-gray-800/50 rounded-lg">
            <div className="bg-purple-500/10 p-3 rounded-full mb-4">
              <FastForward className="w-8 h-8 text-purple-400" />
            </div>
            <h4 className="text-lg font-medium text-white">High Performance</h4>
            <p className="mt-2 text-gray-400 text-sm">
              Built with virtualization to handle massive log files without lag.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-12 bg-gray-800/50 border border-gray-700 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-3">Run Local AI (Ollama)</h3>
        <p className="text-sm text-gray-400 mb-4">Use a local LLM to power incident summaries without any cloud API keys.</p>
        <div className="space-y-3">
          <div>
            <div className="text-xs text-gray-400 mb-1">1) Install Ollama</div>
            <pre className="bg-gray-900 text-gray-200 text-xs p-2 rounded border border-gray-700 overflow-x-auto">brew install ollama</pre>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">2) Start the server</div>
            <pre className="bg-gray-900 text-gray-200 text-xs p-2 rounded border border-gray-700 overflow-x-auto">ollama serve</pre>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">3) Pull a model (first time)</div>
            <pre className="bg-gray-900 text-gray-200 text-xs p-2 rounded border border-gray-700 overflow-x-auto">ollama pull llama3.1:8b</pre>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-4">Once running at http://localhost:11434, the app will use it automatically.</p>
      </div>
    </div>
  );
}