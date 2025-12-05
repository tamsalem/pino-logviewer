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
      <div 
        className="absolute right-0 top-0 h-full border-l shadow-2xl p-5 overflow-auto" 
        style={{ 
          width, 
          backgroundColor: 'var(--logviewer-bg-primary)', 
          borderColor: 'var(--logviewer-border-primary)' 
        }}
      >
        <div 
          ref={dragRef} 
          className="absolute left-0 top-0 h-full w-1 cursor-col-resize bg-transparent z-50"
          style={{ backgroundColor: 'transparent' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--logviewer-border-secondary)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        />
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--logviewer-text-primary)' }}>Incident Explainer</h2>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            style={{ color: 'var(--logviewer-text-secondary)' }}
          >
            Close
          </Button>
        </div>
        <div className="mb-3 text-xs flex items-center gap-2" style={{ color: 'var(--logviewer-text-secondary)' }}>
          {llmAvailable === 'ollama' ? (
            <span>Local LLM (Ollama) connected.</span>
          ) : (
            <>
              <span>No local LLM detected. Falling back to heuristic summary.</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border"
                    style={{
                      color: 'var(--logviewer-text-primary)',
                      backgroundColor: 'var(--logviewer-bg-secondary)',
                      borderColor: 'var(--logviewer-border-primary)'
                    }}
                  >
                    How to enable
                  </Button>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-[520px] shadow-xl rounded-md p-4 border" 
                  align="start"
                  style={{
                    backgroundColor: 'var(--logviewer-bg-elevated)',
                    borderColor: 'var(--logviewer-border-primary)'
                  }}
                >
                  <div className="space-y-3">
                    <div className="text-sm font-medium" style={{ color: 'var(--logviewer-text-primary)' }}>Run a local LLM with Ollama (macOS)</div>
                    <div>
                      <div className="text-xs mb-1" style={{ color: 'var(--logviewer-text-secondary)' }}>1) Install Ollama</div>
                      <pre 
                        className="text-xs p-2 rounded border overflow-x-auto"
                        style={{
                          backgroundColor: 'var(--logviewer-bg-primary)',
                          color: 'var(--logviewer-text-primary)',
                          borderColor: 'var(--logviewer-border-primary)'
                        }}
                      >
                        brew install ollama
                      </pre>
                    </div>
                    <div>
                      <div className="text-xs mb-1" style={{ color: 'var(--logviewer-text-secondary)' }}>2) Start the server</div>
                      <pre 
                        className="text-xs p-2 rounded border overflow-x-auto"
                        style={{
                          backgroundColor: 'var(--logviewer-bg-primary)',
                          color: 'var(--logviewer-text-primary)',
                          borderColor: 'var(--logviewer-border-primary)'
                        }}
                      >
                        ollama serve
                      </pre>
                    </div>
                    <div>
                      <div className="text-xs mb-1" style={{ color: 'var(--logviewer-text-secondary)' }}>3) Pull a model (first time)</div>
                      <pre 
                        className="text-xs p-2 rounded border overflow-x-auto"
                        style={{
                          backgroundColor: 'var(--logviewer-bg-primary)',
                          color: 'var(--logviewer-text-primary)',
                          borderColor: 'var(--logviewer-border-primary)'
                        }}
                      >
                        ollama pull llama3.1:8b
                      </pre>
                    </div>
                    <div className="text-xs" style={{ color: 'var(--logviewer-text-tertiary)' }}>Once running at http://localhost:11434, the app will use it automatically.</div>
                  </div>
                </PopoverContent>
              </Popover>
            </>
          )}
        </div>
        {!a ? (
          <div style={{ color: 'var(--logviewer-text-secondary)' }}>No analysis available.</div>
        ) : (
          <div className="space-y-6">
            <div>
              <div className="text-sm" style={{ color: 'var(--logviewer-text-secondary)' }}>Summary</div>
              <div className="mt-1" style={{ color: 'var(--logviewer-text-primary)' }}>{a.summary}</div>
              {a.clusters[0] && (
                <div 
                  className="mt-3 text-xs rounded p-3 border"
                  style={{
                    backgroundColor: 'var(--logviewer-bg-secondary)',
                    borderColor: 'var(--logviewer-border-primary)'
                  }}
                >
                  <div className="font-medium mb-2" style={{ color: 'var(--logviewer-text-primary)' }}>Top pattern</div>
                  <pre className="font-mono text-xs md:text-sm whitespace-pre-wrap break-words overflow-x-auto" style={{ color: 'var(--logviewer-text-primary)' }}>{a.clusters[0].sample}</pre>
                </div>
              )}
            </div>
            {llmLoading && (
              <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--logviewer-text-secondary)' }}>
                <div className="animate-pulse w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--logviewer-accent-primary)' }} />
                Generating AI summary...
              </div>
            )}
            {a.llmSummary && !llmLoading && (
              <div>
                <div className="text-sm" style={{ color: 'var(--logviewer-text-secondary)' }}>AI Summary</div>
                <div className="mt-1 prose prose-invert max-w-none" style={{ color: 'var(--logviewer-text-primary)' }} dangerouslySetInnerHTML={{ __html: sanitizeLLMHtml(a.llmSummary) }} />
              </div>
            )}
            <div>
              <div className="text-sm mb-2" style={{ color: 'var(--logviewer-text-secondary)' }}>Error Categories</div>
              <div className="space-y-2">
                {a.categories.slice(0, 5).map((cat, i) => (
                  <div 
                    key={i} 
                    className="rounded p-3 border"
                    style={{
                      backgroundColor: 'var(--logviewer-bg-secondary)',
                      borderColor: 'var(--logviewer-border-primary)'
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-medium`} style={{
                        color: cat.category.priority <= 3 ? 'var(--logviewer-error-text)' :
                               cat.category.priority <= 6 ? 'var(--logviewer-warn-text)' :
                               'var(--logviewer-text-primary)'
                      }}>
                        {cat.category.name}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--logviewer-text-secondary)' }}>{cat.count} ({cat.percentage}%)</span>
                    </div>
                    <div className="text-xs" style={{ color: 'var(--logviewer-text-tertiary)' }}>{cat.category.description}</div>
                  </div>
                ))}
                {a.categories.length === 0 && <div className="text-sm" style={{ color: 'var(--logviewer-text-secondary)' }}>No categories detected</div>}
              </div>
            </div>
            <div>
              <div className="text-sm" style={{ color: 'var(--logviewer-text-secondary)' }}>Timeline</div>
              <div className="mt-2 h-16 flex items-end gap-1">
                {a.spikes.length === 0 && (
                  <div className="text-sm" style={{ color: 'var(--logviewer-text-secondary)' }}>No distinct spike detected</div>
                )}
                {a.spikes.map((s, i) => (
                  <div 
                    key={i} 
                    className="transition-colors" 
                    style={{ 
                      height: Math.min(56, 10 + Math.log2(2 + s.count) * 12), 
                      width: 16,
                      backgroundColor: 'var(--logviewer-accent-primary)'
                    }} 
                    title={`${new Date(s.start).toLocaleString()} - ${new Date(s.end).toLocaleString()} (${s.count})`}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--logviewer-accent-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--logviewer-accent-primary)'}
                  />
                ))}
              </div>
            </div>
            <div>
              <div className="text-sm mb-2" style={{ color: 'var(--logviewer-text-secondary)' }}>Top error signatures</div>
              <div className="space-y-2">
                {a.clusters.map((c, i) => (
                  <div 
                    key={i} 
                    className="rounded p-3 border"
                    style={{
                      backgroundColor: 'var(--logviewer-bg-secondary)',
                      borderColor: 'var(--logviewer-border-primary)'
                    }}
                  >
                    <pre className="font-mono text-xs md:text-sm whitespace-pre-wrap break-words overflow-x-auto" title={c.sample} style={{ color: 'var(--logviewer-text-primary)' }}>
{c.sample}
                    </pre>
                    <div className="text-xs mt-2" style={{ color: 'var(--logviewer-text-secondary)' }}>Count: {c.count}</div>
                  </div>
                ))}
                {a.clusters.length === 0 && <div className="text-sm" style={{ color: 'var(--logviewer-text-secondary)' }}>No dominant patterns</div>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
