import React, { useRef, useState, useEffect } from 'react'
import { Button, Card, Popover, PopoverContent, PopoverTrigger } from '../../../../components/ui'
import { type IncidentAnalysis } from '../../../services'

export default function IncidentDrawer({ open, onClose, analysis, llmAvailable, llmLoading }: { open: boolean, onClose: () => void, analysis: IncidentAnalysis | null, llmAvailable?: 'none' | 'gemini' | 'ollama' | 'any', llmLoading?: boolean }) {
  const [width, setWidth] = useState(520)
  const dragRef = useRef<HTMLDivElement | null>(null)
  const startXRef = useRef<number>(0)
  const startWidthRef = useRef<number>(520)

  useEffect(() => {
    const el = dragRef.current
    if (!el) return
    let dragging = false
    const onDown = (e: MouseEvent) => {
      dragging = true
      startXRef.current = e.clientX
      startWidthRef.current = width
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
      e.preventDefault()
    }
    const onMove = (e: MouseEvent) => {
      if (!dragging) return
      const dx = startXRef.current - e.clientX
      const next = Math.max(360, Math.min(1200, startWidthRef.current + dx))
      setWidth(next)
    }
    const onUp = () => {
      if (!dragging) return
      dragging = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    el.addEventListener('mousedown', onDown)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      el.removeEventListener('mousedown', onDown)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [width])

  if (!open) return null
  const a = analysis

  const sanitizeLLMHtml = (html: string) => {
    // basic sanitization: strip script/style and on* handlers
    try {
      const div = document.createElement('div')
      div.innerHTML = html
      div.querySelectorAll('script,style').forEach(n => n.remove())
      div.querySelectorAll('*').forEach((el: Element) => {
        const attrs = Array.from(el.attributes)
        for (const a of attrs) {
          const name = a.name
          if (/^on/i.test(name)) (el as HTMLElement).removeAttribute(name)
        }
      })
      return div.innerHTML
    } catch {
      return html
    }
  }
  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full bg-gray-900 border-l border-gray-700 shadow-2xl p-5 overflow-auto" style={{ width }}>
        <div ref={dragRef} className="absolute left-0 top-0 h-full w-1 cursor-col-resize bg-transparent hover:bg-gray-600/40 z-50" />
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-200">Incident Explainer</h2>
          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white" onClick={onClose}>Close</Button>
        </div>
        <div className="mb-3 text-xs text-gray-400 flex items-center gap-2">
          {llmAvailable === 'ollama' ? (
            <span>Local LLM (Ollama) connected.</span>
          ) : (
            <>
              <span>No local LLM detected. Falling back to heuristic summary.</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="text-gray-300 bg-gray-800 border-gray-700 hover:bg-gray-700">How to enable</Button>
                </PopoverTrigger>
                <PopoverContent className="w-[520px] bg-gray-800 border border-gray-700 shadow-xl rounded-md p-4" align="start">
                  <div className="space-y-3">
                    <div className="text-sm text-gray-300 font-medium">Run a local LLM with Ollama (macOS)</div>
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
                    <div className="text-xs text-gray-500">Once running at http://localhost:11434, the app will use it automatically.</div>
                  </div>
                </PopoverContent>
              </Popover>
            </>
          )}
        </div>
        {!a ? (
          <div className="text-gray-400">No analysis available.</div>
        ) : (
          <div className="space-y-6">
            <div>
              <div className="text-sm text-gray-400">Summary</div>
              <div className="mt-1 text-gray-200">{a.summary}</div>
              {a.clusters[0] && (
                <div className="mt-3 text-xs text-gray-500 bg-gray-800/60 border border-gray-700 rounded p-3">
                  <div className="font-medium text-gray-300 mb-2">Top pattern</div>
                  <pre className="font-mono text-xs md:text-sm text-gray-200 whitespace-pre-wrap break-words overflow-x-auto">{a.clusters[0].sample}</pre>
                </div>
              )}
            </div>
            {llmLoading && (
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <div className="animate-pulse w-2 h-2 rounded-full bg-indigo-400" />
                Generating AI summary...
              </div>
            )}
            {a.llmSummary && !llmLoading && (
              <div>
                <div className="text-sm text-gray-400">AI Summary</div>
                <div className="mt-1 text-gray-200 prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: sanitizeLLMHtml(a.llmSummary) }} />
              </div>
            )}
            <div>
              <div className="text-sm text-gray-400 mb-2">Error Categories</div>
              <div className="space-y-2">
                {a.categories.slice(0, 5).map((cat, i) => (
                  <div key={i} className="bg-gray-800/60 border border-gray-700 rounded p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-medium ${
                        cat.category.priority <= 3 ? 'text-red-300' :
                        cat.category.priority <= 6 ? 'text-yellow-300' :
                        'text-gray-300'
                      }`}>
                        {cat.category.name}
                      </span>
                      <span className="text-xs text-gray-400">{cat.count} ({cat.percentage}%)</span>
                    </div>
                    <div className="text-xs text-gray-500">{cat.category.description}</div>
                  </div>
                ))}
                {a.categories.length === 0 && <div className="text-gray-500 text-sm">No categories detected</div>}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-400">Timeline</div>
              <div className="mt-2 h-16 flex items-end gap-1">
                {a.spikes.length === 0 && (
                  <div className="text-gray-500 text-sm">No distinct spike detected</div>
                )}
                {a.spikes.map((s, i) => (
                  <div key={i} className="bg-indigo-600/60 hover:bg-indigo-500 transition-colors" style={{ height: Math.min(56, 10 + Math.log2(2 + s.count) * 12), width: 16 }} title={`${new Date(s.start).toLocaleString()} - ${new Date(s.end).toLocaleString()} (${s.count})`} />
                ))}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-400 mb-2">Top error signatures</div>
              <div className="space-y-2">
                {a.clusters.map((c, i) => (
                  <div key={i} className="bg-gray-800/60 border border-gray-700 rounded p-3">
                    <pre className="font-mono text-xs md:text-sm text-gray-200 whitespace-pre-wrap break-words overflow-x-auto" title={c.sample}>
{c.sample}
                    </pre>
                    <div className="text-xs text-gray-400 mt-2">Count: {c.count}</div>
                  </div>
                ))}
                {a.clusters.length === 0 && <div className="text-gray-500 text-sm">No dominant patterns</div>}
              </div>
            </div>
            {/* Impact removed */}
          </div>
        )}
      </div>
    </div>
  )
}


