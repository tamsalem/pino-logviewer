export type SpikeWindow = { start: number; end: number; count: number };
export type Cluster = { signature: string; sample: string; count: number; fields: Record<string, unknown> };
// Impact removed as per requirements

export type IncidentAnalysis = {
  total: number;
  timeRange: { start: number; end: number } | null;
  spikes: SpikeWindow[];
  clusters: Cluster[];
  summary: string;
  llmSummary?: string;
};

export type LogEntry = {
  id: number;
  level: string;
  timestamp: string;
  message: string;
  data: any;
  raw: string;
  isJson: boolean;
};

const isErrorLevel = (level: string) => {
  const up = (level || '').toUpperCase();
  return up === 'ERROR' || up === 'FATAL';
};

export function detectSpikes(entries: LogEntry[], bucketMs = 60_000): SpikeWindow[] {
  if (entries.length === 0) return [];
  const times = entries.map(e => new Date(e.timestamp).getTime()).sort((a,b)=>a-b);
  const start = times[0];
  const end = times[times.length-1];
  const buckets: number[] = [];
  for (let t = start; t <= end + bucketMs; t += bucketMs) buckets.push(0);
  times.forEach(t => {
    const idx = Math.floor((t - start) / bucketMs);
    buckets[idx] = (buckets[idx] || 0) + 1;
  });
  const mean = buckets.reduce((a,b)=>a+b,0) / buckets.length;
  const variance = buckets.reduce((a,b)=>a + Math.pow(b-mean,2), 0) / buckets.length;
  const std = Math.sqrt(variance);
  const threshold = Math.max(10, mean + 3 * std);
  const spikes: SpikeWindow[] = [];
  let runStartIdx: number | null = null;
  let runCount = 0;
  for (let i=0;i<buckets.length;i++) {
    if (buckets[i] >= threshold) {
      if (runStartIdx === null) runStartIdx = i;
      runCount += buckets[i];
    } else if (runStartIdx !== null) {
      const s = start + runStartIdx * bucketMs;
      const e = start + (i) * bucketMs - 1;
      spikes.push({ start: s, end: e, count: runCount });
      runStartIdx = null; runCount = 0;
    }
  }
  if (runStartIdx !== null) {
    const s = start + runStartIdx * bucketMs;
    const e = start + (buckets.length) * bucketMs - 1;
    spikes.push({ start: s, end: e, count: runCount });
  }
  return spikes.sort((a,b)=>b.count-a.count);
}

function normalizeMessage(raw: string): string {
  return (raw || '')
    .toLowerCase()
    .replace(/"[^"]+"|'[^']+'/g, '"<str>"')
    .replace(/\b[0-9a-f]{8,}\b/g, '<id>')
    .replace(/\b\d+\b/g, '<num>')
    .replace(/\s+/g, ' ')
    .trim();
}

export function clusterMessages(entries: LogEntry[], maxClusters = 10): Cluster[] {
  const map = new Map<string, { sample: string; count: number; fields: Record<string, unknown> }>();
  for (const e of entries) {
    const base = e.isJson ? JSON.stringify(Object.keys(e.data || {}).sort()) : '';
    const sig = base + '|' + normalizeMessage(e.message || e.raw);
    const curr = map.get(sig) || { sample: e.message || e.raw, count: 0, fields: {} };
    curr.count += 1;
    if (e.isJson) {
      const d = e.data || {};
      ['code','error','name','path','method','service'].forEach(k => {
        if (d[k] !== undefined && curr.fields[k] === undefined) curr.fields[k] = d[k];
      });
    }
    map.set(sig, curr);
  }
  return [...map.entries()]
    .map(([signature, v]) => ({ signature, sample: v.sample, count: v.count, fields: v.fields }))
    .sort((a,b)=>b.count-a.count)
    .slice(0, maxClusters);
}

// computeImpact removed

export function analyzeIncident(allEntries: LogEntry[]): IncidentAnalysis {
  const entries = allEntries.filter(e => isErrorLevel(e.level));
  const total = entries.length;
  const timeRange = total ? { start: new Date(entries[0].timestamp).getTime(), end: new Date(entries[entries.length-1].timestamp).getTime() } : null;
  const spikes = detectSpikes(entries);
  const focus = spikes[0]
    ? entries.filter(e => {
        const t = new Date(e.timestamp).getTime();
        return t >= spikes[0].start && t <= spikes[0].end;
      })
    : entries;
  const clusters = clusterMessages(focus);
  const top = clusters[0];
  const summary = total === 0
    ? 'No error-level incidents detected in the current view.'
    : `Detected ${spikes.length ? 'a spike' : 'an incident'} with ${focus.length} error events.`;
  return { total, timeRange, spikes, clusters, summary };
}


export async function summarizeIncidentWithOllama(analysis: IncidentAnalysis, model = 'llama3.1:8b'): Promise<string | null> {
  try {
    // Quick health check: list tags
    const tags = await fetch('http://localhost:11434/api/tags');
    if (!tags.ok) return null;
  } catch {
    return null;
  }
  try {
    const prompt = [
      'ROLE: You are a senior SRE/incident commander writing a crisp engineering update.',
      'CONSTRAINTS:',
      '- Use ONLY the provided evidence. Do not invent data.',
      '- Be specific and high-signal. Prefer concrete fields (codes, endpoints, components).',
      '- Keep it concise but complete. Avoid filler. No speculation without marking it as hypothesis.',
      '- Output MUST be clean HTML (no markdown), a single snippet (no <html>/<body>).',
      '- Use <p> for short paragraphs, <ul>/<li> for lists, and add clear spacing between sections.',
      '',
      'EVIDENCE (JSON):',
      JSON.stringify({
        total: analysis.total,
        spikes: analysis.spikes,
        topClusters: analysis.clusters.slice(0, 5),
        heuristic: analysis.summary,
      }),
      '',
      'TASK:',
      '- Analyze the incident and produce the following sections as HTML:',
      '  <h3>Overview</h3>',
      '  <p>What happened and when (include spike window if present) and total error volume.</p>',
      '  <br/>',
      '  <h3>Dominant Error Patterns</h3>',
      '  <ul><li>List 2–5 representative patterns with brief descriptors (quote only safe message fragments).</li></ul>',
      '  <br/>',
      '  <h3>Primary Root Cause</h3>',
      '  <p>Choose ONE most likely cause based on earliest signals/pattern consistency.</p>',
      '  <p>Explain why it is primary in 1–3 sentences, citing fields (e.g., code, service, path).</p>',
      '  <br/>',
      '  <h3>Alternative Hypotheses</h3>',
      '  <ul><li>Provide 2–3 plausible alternatives with 1 sentence each. Label as hypotheses.</li></ul>',
      '  <br/>',
      '  <h3>Immediate Next Steps</h3>',
      '  <ul><li>3–6 concrete actions (validation, rollback, feature flag, log/metric to check, owner to page).</li></ul>',
      '',
      'STYLE:',
      '- Use headings, <ul>/<li>, and <strong> for emphasis.',
      '- Keep paragraphs short. Avoid jargon if not essential.',
    ].join('\n');

    const res = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        options: { temperature: 0.2 },
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text = data?.response?.trim();
    return typeof text === 'string' ? text : null;
  } catch {
    return null;
  }
}
