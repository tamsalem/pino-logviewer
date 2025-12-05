import React, { useRef, useState, useEffect } from 'react'
import { Button, Card, Popover, PopoverContent, PopoverTrigger } from '../../../../components/ui'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { type IncidentAnalysis } from '../../../services'

export default function IncidentDrawer({ open, onClose, analysis, llmAvailable, llmLoading }: { open: boolean, onClose: () => void, analysis: IncidentAnalysis | null, llmAvailable?: 'none' | 'gemini' | 'ollama' | 'any', llmLoading?: boolean }) {
  const [width, setWidth] = useState(520)
  const dragRef = useRef<HTMLDivElement | null>(null)
  const startXRef = useRef<number>(0)
  const startWidthRef = useRef<number>(520)
  
  // Section collapse states
  const [sectionsExpanded, setSectionsExpanded] = useState({
    aiSummary: true,
    errorCategories: true,
    timeline: true,
    errorSignatures: true,
  })

  const toggleSection = (section: keyof typeof sectionsExpanded) => {
    setSectionsExpanded(prev => ({ ...prev, [section]: !prev[section] }))
  }

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
    try {
      // Remove markdown code fences that LLM might add
      let cleaned = html
        .replace(/```html\s*/gi, '')
        .replace(/```\s*$/gi, '')
        .trim()
      
      const div = document.createElement('div')
      div.innerHTML = cleaned
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

  const SectionHeader = ({ title, isExpanded, onToggle, count }: { title: string, isExpanded: boolean, onToggle: () => void, count?: number }) => (
    <button
      onClick={onToggle}
      className="flex items-center justify-between w-full p-3 rounded transition-colors"
      style={{ 
        backgroundColor: 'var(--logviewer-bg-secondary)',
        borderBottom: `1px solid var(--logviewer-border-primary)`
      }}
      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--logviewer-bg-hover)'}
      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--logviewer-bg-secondary)'}
    >
      <div className="flex items-center gap-2">
        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        <span className="font-medium" style={{ color: 'var(--logviewer-text-primary)' }}>{title}</span>
        {count !== undefined && <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--logviewer-bg-tertiary)', color: 'var(--logviewer-text-secondary)' }}>{count}</span>}
      </div>
    </button>
  )

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
        
        {/* Header */}
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

        {/* LLM Status */}
        <div className="mb-4 text-xs flex items-center gap-2" style={{ color: 'var(--logviewer-text-secondary)' }}>
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
                      <div className="text-xs mb-1" style={{ color: 'var(--logviewer-text-secondary)' }}>3) Pull a recommended model</div>
                      <pre
                        className="text-xs p-2 rounded border overflow-x-auto"
                        style={{
                          backgroundColor: 'var(--logviewer-bg-primary)',
                          color: 'var(--logviewer-text-primary)',
                          borderColor: 'var(--logviewer-border-primary)'
                        }}
                      >
                        ollama pull qwen2.5:7b
                      </pre>
                      <div className="text-xs mt-2 p-2 rounded" style={{ backgroundColor: 'var(--logviewer-info-bg)', color: 'var(--logviewer-info-text)' }}>
                        <strong>Recommended:</strong> qwen2.5:7b - Excellent for log analysis and technical content
                      </div>
                      <div className="text-xs mt-1" style={{ color: 'var(--logviewer-text-tertiary)' }}>
                        Alternatives: llama3.2:3b (faster, smaller) or deepseek-r1:7b (reasoning-focused)
                      </div>
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
          <div className="space-y-4">
            {/* Summary - Always Visible */}
            <div 
              className="p-4 rounded border"
              style={{
                backgroundColor: 'var(--logviewer-bg-secondary)',
                borderColor: 'var(--logviewer-border-primary)'
              }}
            >
              <div className="text-sm font-medium mb-2" style={{ color: 'var(--logviewer-text-secondary)' }}>Summary</div>
              <div style={{ color: 'var(--logviewer-text-primary)' }}>{a.summary}</div>
              {a.clusters[0] && (
                <div 
                  className="mt-3 text-xs rounded p-3 border"
                  style={{
                    backgroundColor: 'var(--logviewer-bg-tertiary)',
                    borderColor: 'var(--logviewer-border-primary)'
                  }}
                >
                  <div className="font-medium mb-2" style={{ color: 'var(--logviewer-text-primary)' }}>Top pattern</div>
                  <pre className="font-mono text-xs whitespace-pre-wrap break-words overflow-x-auto" style={{ color: 'var(--logviewer-text-primary)' }}>{a.clusters[0].sample}</pre>
                </div>
              )}
            </div>

            {/* AI Summary Section - Only if loading or has data */}
            {(llmLoading || (a.llmSummary && !llmLoading)) && (
              <div>
                <SectionHeader 
                  title="AI Summary" 
                  isExpanded={sectionsExpanded.aiSummary} 
                  onToggle={() => toggleSection('aiSummary')}
                />
                {sectionsExpanded.aiSummary && (
                  <div className="p-4" style={{ backgroundColor: 'var(--logviewer-bg-secondary)' }}>
                    {llmLoading ? (
                      <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--logviewer-text-secondary)' }}>
                        <div className="animate-pulse w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--logviewer-accent-primary)' }} />
                        Generating AI summary...
                      </div>
                    ) : (
                      <>
                        <div
                          className="llm-summary-content"
                          style={{
                            color: 'var(--logviewer-text-primary)',
                            fontSize: '0.875rem',
                            lineHeight: '1.5'
                          }}
                          dangerouslySetInnerHTML={{ __html: sanitizeLLMHtml(a.llmSummary!) }}
                        />
                        <style>{`
                        .llm-summary-content .incident-section {
                          margin-bottom: 1.5rem;
                          padding: 1rem;
                          background-color: var(--logviewer-bg-tertiary);
                          border-radius: 0.375rem;
                          border: 1px solid var(--logviewer-border-primary);
                        }
                        
                        .llm-summary-content .section-title {
                          font-size: 1rem;
                          font-weight: 600;
                          margin: 0 0 0.75rem 0;
                          color: var(--logviewer-text-primary);
                          padding-bottom: 0.5rem;
                          border-bottom: 1px solid var(--logviewer-border-secondary);
                        }
                        
                        .llm-summary-content .section-content {
                          color: var(--logviewer-text-primary);
                        }
                        
                        .llm-summary-content .section-content p {
                          margin: 0.5rem 0;
                          line-height: 1.6;
                        }
                        
                        .llm-summary-content .section-content p:first-child {
                          margin-top: 0;
                        }
                        
                        .llm-summary-content .section-content p:last-child {
                          margin-bottom: 0;
                        }
                        
                        .llm-summary-content .root-cause-box {
                          background-color: var(--logviewer-bg-primary);
                          border-left: 3px solid var(--logviewer-accent-primary);
                          padding: 0.75rem;
                          border-radius: 0.25rem;
                        }
                        
                        .llm-summary-content .cause-title {
                          font-size: 0.9375rem;
                          margin-bottom: 0.5rem;
                          color: var(--logviewer-accent-primary);
                        }
                        
                        .llm-summary-content .cause-explanation {
                          margin: 0.5rem 0;
                        }
                        
                        .llm-summary-content .cause-evidence {
                          margin-top: 0.5rem;
                          font-size: 0.8125rem;
                          color: var(--logviewer-text-secondary);
                        }
                        
                        .llm-summary-content .pattern-list,
                        .llm-summary-content .hypothesis-list,
                        .llm-summary-content .action-list {
                          margin: 0.5rem 0;
                          padding-left: 1.5rem;
                        }
                        
                        .llm-summary-content .pattern-list li,
                        .llm-summary-content .hypothesis-list li,
                        .llm-summary-content .action-list li {
                          margin: 0.5rem 0;
                          line-height: 1.6;
                        }
                        
                        .llm-summary-content .action-list {
                          list-style-type: decimal;
                        }
                        
                        .llm-summary-content strong {
                          color: var(--logviewer-text-primary);
                          font-weight: 600;
                        }
                        
                        .llm-summary-content h3 {
                          font-size: 1rem;
                          font-weight: 600;
                          margin: 1rem 0 0.5rem 0;
                          color: var(--logviewer-text-primary);
                        }
                        
                        .llm-summary-content ul,
                        .llm-summary-content ol {
                          margin: 0.5rem 0;
                          padding-left: 1.5rem;
                        }
                        
                        .llm-summary-content li {
                          margin: 0.375rem 0;
                        }
                        
                        .llm-summary-content code {
                          background-color: var(--logviewer-bg-primary);
                          padding: 0.125rem 0.25rem;
                          border-radius: 0.25rem;
                          font-family: monospace;
                          font-size: 0.8125rem;
                          color: var(--logviewer-accent-primary);
                        }
                        `}</style>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Error Categories Section - Only if has data */}
            {a.categories.length > 0 && (
              <div>
                <SectionHeader 
                  title="Error Categories" 
                  isExpanded={sectionsExpanded.errorCategories} 
                  onToggle={() => toggleSection('errorCategories')}
                  count={a.categories.length}
                />
                {sectionsExpanded.errorCategories && (
                  <div className="p-4 space-y-2" style={{ backgroundColor: 'var(--logviewer-bg-secondary)' }}>
                    {a.categories.slice(0, 5).map((cat, i) => (
                      <div 
                        key={i} 
                        className="rounded p-3 border"
                        style={{
                          backgroundColor: 'var(--logviewer-bg-tertiary)',
                          borderColor: 'var(--logviewer-border-primary)'
                        }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium" style={{
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
                  </div>
                )}
              </div>
            )}

            {/* Timeline Section - Only if has data */}
            {a.spikes.length > 0 && (
              <div>
                <SectionHeader 
                  title="Timeline" 
                  isExpanded={sectionsExpanded.timeline} 
                  onToggle={() => toggleSection('timeline')}
                  count={a.spikes.length}
                />
                {sectionsExpanded.timeline && (
                  <div className="p-4" style={{ backgroundColor: 'var(--logviewer-bg-secondary)' }}>
                    <div className="h-16 flex items-end gap-1">
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
                )}
              </div>
            )}

            {/* Error Signatures Section - Only if has data */}
            {a.clusters.length > 0 && (
              <div>
                <SectionHeader 
                  title="Top Error Signatures" 
                  isExpanded={sectionsExpanded.errorSignatures} 
                  onToggle={() => toggleSection('errorSignatures')}
                  count={a.clusters.length}
                />
                {sectionsExpanded.errorSignatures && (
                  <div className="p-4 space-y-2" style={{ backgroundColor: 'var(--logviewer-bg-secondary)' }}>
                    {a.clusters.map((c, i) => (
                      <div 
                        key={i} 
                        className="rounded p-3 border"
                        style={{
                          backgroundColor: 'var(--logviewer-bg-tertiary)',
                          borderColor: 'var(--logviewer-border-primary)'
                        }}
                      >
                        <pre className="font-mono text-xs whitespace-pre-wrap break-words overflow-x-auto" title={c.sample} style={{ color: 'var(--logviewer-text-primary)' }}>
{c.sample}
                        </pre>
                        <div className="text-xs mt-2" style={{ color: 'var(--logviewer-text-secondary)' }}>Count: {c.count}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
