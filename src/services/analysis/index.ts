export type SpikeWindow = { start: number; end: number; count: number };
export type Cluster = { signature: string; sample: string; count: number; fields: Record<string, unknown> };
export type ErrorCategory = { name: string; priority: number; description: string; patterns: string[] };
// Impact removed as per requirements

export type IncidentAnalysis = {
  total: number;
  timeRange: { start: number; end: number } | null;
  spikes: SpikeWindow[];
  clusters: Cluster[];
  categories: { category: ErrorCategory; count: number; percentage: number }[];
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

// Error categories with priority ranking (lower number = higher priority)
const ERROR_CATEGORIES: ErrorCategory[] = [
  { name: 'Database', priority: 1, description: 'Database connection, query, or transaction failures', patterns: ['database', 'db', 'sql', 'connection', 'timeout', 'deadlock', 'constraint', 'foreign key', 'transaction', 'rollback', 'commit', 'postgres', 'mysql', 'mongodb', 'redis'] },
  { name: 'Authentication', priority: 2, description: 'User authentication and authorization failures', patterns: ['auth', 'login', 'token', 'jwt', 'oauth', 'permission', 'unauthorized', 'forbidden', 'credential', 'password', 'session', 'expired'] },
  { name: 'Network', priority: 3, description: 'Network connectivity and communication issues', patterns: ['network', 'connection', 'timeout', 'refused', 'unreachable', 'dns', 'socket', 'http', 'tcp', 'udp', 'proxy', 'gateway'] },
  { name: 'External API', priority: 4, description: 'Third-party service and API failures', patterns: ['api', 'external', 'service', 'endpoint', 'http', 'rest', 'graphql', 'webhook', 'integration', 'third-party', 'upstream'] },
  { name: 'File System', priority: 5, description: 'File and storage system errors', patterns: ['file', 'disk', 'storage', 'io', 'read', 'write', 'permission', 'not found', 'access denied', 'quota', 'space', 'mount'] },
  { name: 'Memory', priority: 6, description: 'Memory allocation and garbage collection issues', patterns: ['memory', 'heap', 'out of memory', 'oom', 'gc', 'garbage', 'allocation', 'leak', 'buffer'] },
  { name: 'Configuration', priority: 7, description: 'Application configuration and environment issues', patterns: ['config', 'environment', 'env', 'setting', 'parameter', 'missing', 'invalid', 'default', 'bootstrap'] },
  { name: 'Validation', priority: 8, description: 'Input validation and data format errors', patterns: ['validation', 'invalid', 'format', 'parse', 'json', 'xml', 'schema', 'required', 'type', 'cast'] },
  { name: 'Business Logic', priority: 9, description: 'Application-specific business rule violations', patterns: ['business', 'rule', 'constraint', 'limit', 'quota', 'rate', 'policy', 'workflow', 'state'] },
  { name: 'Concurrency', priority: 10, description: 'Threading, locking, and concurrent access issues', patterns: ['concurrent', 'thread', 'lock', 'race', 'deadlock', 'mutex', 'semaphore', 'atomic', 'synchronization'] },
  { name: 'Security', priority: 11, description: 'Security violations and suspicious activities', patterns: ['security', 'attack', 'injection', 'xss', 'csrf', 'malicious', 'breach', 'exploit', 'vulnerability'] },
  { name: 'Performance', priority: 12, description: 'Performance degradation and resource exhaustion', patterns: ['performance', 'slow', 'latency', 'timeout', 'bottleneck', 'cpu', 'load', 'throughput', 'response time'] },
  { name: 'Dependency', priority: 13, description: 'External dependency and service failures', patterns: ['dependency', 'service', 'microservice', 'circuit', 'breaker', 'fallback', 'retry', 'cascade'] },
  { name: 'Serialization', priority: 14, description: 'Data serialization and deserialization errors', patterns: ['serialize', 'deserialize', 'marshal', 'unmarshal', 'encode', 'decode', 'binary', 'protobuf', 'avro'] },
  { name: 'Cache', priority: 15, description: 'Caching system failures and inconsistencies', patterns: ['cache', 'redis', 'memcached', 'ttl', 'expire', 'invalidate', 'miss', 'hit', 'eviction'] },
  { name: 'Queue', priority: 16, description: 'Message queue and event processing failures', patterns: ['queue', 'message', 'event', 'producer', 'consumer', 'kafka', 'rabbitmq', 'sqs', 'pubsub'] },
  { name: 'Monitoring', priority: 17, description: 'Monitoring, logging, and observability issues', patterns: ['monitor', 'metric', 'log', 'trace', 'alert', 'dashboard', 'telemetry', 'observability'] },
  { name: 'Deployment', priority: 18, description: 'Deployment and infrastructure issues', patterns: ['deploy', 'container', 'docker', 'kubernetes', 'pod', 'node', 'infrastructure', 'orchestration'] },
  { name: 'Code Error', priority: 19, description: 'Application code errors and exceptions', patterns: ['exception', 'error', 'bug', 'null', 'undefined', 'reference', 'index', 'range', 'stack', 'trace'] },
  { name: 'Unknown', priority: 20, description: 'Unclassified or unknown error types', patterns: [] }
];

function categorizeError(message: string, data: any): ErrorCategory {
  const text = `${message} ${JSON.stringify(data || {})}`.toLowerCase();
  
  for (const category of ERROR_CATEGORIES) {
    if (category.patterns.some(pattern => text.includes(pattern))) {
      return category;
    }
  }
  
  return ERROR_CATEGORIES[ERROR_CATEGORIES.length - 1]; // Unknown
}

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
  
  // Categorize errors
  const categoryCounts = new Map<string, number>();
  focus.forEach(entry => {
    const category = categorizeError(entry.message, entry.data);
    categoryCounts.set(category.name, (categoryCounts.get(category.name) || 0) + 1);
  });
  
  const categories = Array.from(categoryCounts.entries())
    .map(([name, count]) => {
      const category = ERROR_CATEGORIES.find(c => c.name === name)!;
      return {
        category,
        count,
        percentage: Math.round((count / focus.length) * 100)
      };
    })
    .sort((a, b) => a.category.priority - b.category.priority);
  
  // Determine top pattern: use most frequent cluster, or fall back to highest priority category
  let topPattern = '';
  if (clusters.length > 0 && clusters[0].count > 1) {
    // Use cluster if it appears more than once
    topPattern = clusters[0].sample;
  } else if (categories.length > 0) {
    // Fall back to highest priority category description
    topPattern = categories[0].category.description;
  }
  
  const summary = total === 0
    ? 'No error-level incidents detected in the current view.'
    : `Detected ${spikes.length ? 'a spike' : 'an incident'} with ${focus.length} error events. Top pattern: "${topPattern}"`;
  return { total, timeRange, spikes, clusters, categories, summary };
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
      'ROLE: You are a senior SRE/incident commander writing a comprehensive yet readable engineering incident report.',
      '',
      'CONSTRAINTS:',
      '- Use ONLY the provided evidence. Do not invent data.',
      '- Be specific and high-signal. Prefer concrete fields (codes, endpoints, components).',
      '- Keep it concise but complete. Avoid filler. No speculation without marking it as hypothesis.',
      '- Output MUST be clean, semantic HTML (no markdown), a single snippet (no <html>/<body>).',
      '- Use proper HTML5 semantic elements with clear visual hierarchy.',
      '',
      'EVIDENCE (JSON):',
      JSON.stringify({
        total: analysis.total,
        spikes: analysis.spikes,
        topClusters: analysis.clusters.slice(0, 5),
        categories: analysis.categories.slice(0, 5),
        heuristic: analysis.summary,
      }),
      '',
      'TASK:',
      'Analyze the incident and produce a well-structured HTML report with the following sections:',
      '',
      '1. OVERVIEW SECTION:',
      '   <div class="incident-section">',
      '     <h3 class="section-title">📊 Incident Overview</h3>',
      '     <div class="section-content">',
      '       <p><strong>What:</strong> Brief description of the incident</p>',
      '       <p><strong>When:</strong> Time window (include spike window if present)</p>',
      '       <p><strong>Volume:</strong> Total error count and rate</p>',
      '     </div>',
      '   </div>',
      '',
      '2. ERROR PATTERNS SECTION:',
      '   <div class="incident-section">',
      '     <h3 class="section-title">🔍 Dominant Error Patterns</h3>',
      '     <div class="section-content">',
      '       <ul class="pattern-list">',
      '         <li><strong>Pattern 1:</strong> Description with frequency</li>',
      '         <li><strong>Pattern 2:</strong> Description with frequency</li>',
      '         <!-- List 3-5 most significant patterns -->',
      '       </ul>',
      '     </div>',
      '   </div>',
      '',
      '3. ROOT CAUSE ANALYSIS:',
      '   <div class="incident-section">',
      '     <h3 class="section-title">🎯 Primary Root Cause</h3>',
      '     <div class="section-content">',
      '       <div class="root-cause-box">',
      '         <p class="cause-title"><strong>Most Likely Cause:</strong> [Category Name]</p>',
      '         <p class="cause-explanation">Explain in 2-3 sentences why this is the primary cause, citing error categories, patterns, and specific fields (e.g., error codes, services, endpoints).</p>',
      '         <p class="cause-evidence"><strong>Supporting Evidence:</strong> List key indicators</p>',
      '       </div>',
      '     </div>',
      '   </div>',
      '',
      '4. ALTERNATIVE HYPOTHESES:',
      '   <div class="incident-section">',
      '     <h3 class="section-title">💡 Alternative Hypotheses</h3>',
      '     <div class="section-content">',
      '       <ul class="hypothesis-list">',
      '         <li><strong>Hypothesis 1:</strong> Brief explanation (1-2 sentences)</li>',
      '         <li><strong>Hypothesis 2:</strong> Brief explanation (1-2 sentences)</li>',
      '         <!-- Provide 2-3 plausible alternatives -->',
      '       </ul>',
      '     </div>',
      '   </div>',
      '',
      '5. ACTION ITEMS:',
      '   <div class="incident-section">',
      '     <h3 class="section-title">⚡ Immediate Next Steps</h3>',
      '     <div class="section-content">',
      '       <ol class="action-list">',
      '         <li><strong>Validate:</strong> Specific validation steps</li>',
      '         <li><strong>Investigate:</strong> Logs/metrics to check</li>',
      '         <li><strong>Mitigate:</strong> Immediate mitigation actions (rollback, feature flag, etc.)</li>',
      '         <li><strong>Monitor:</strong> What to watch</li>',
      '         <li><strong>Escalate:</strong> Who to notify if needed</li>',
      '         <!-- Provide 4-6 concrete, actionable steps -->',
      '       </ol>',
      '     </div>',
      '   </div>',
      '',
      'FORMATTING RULES:',
      '- Use <div class="incident-section"> for each major section',
      '- Use <h3 class="section-title"> for section headers with emoji prefix',
      '- Use <div class="section-content"> to wrap section content',
      '- Use <strong> for emphasis on key terms',
      '- Use <ul class="pattern-list">, <ul class="hypothesis-list">, <ol class="action-list"> for lists',
      '- Use <div class="root-cause-box"> for the root cause highlight',
      '- Keep paragraphs short (2-3 sentences max)',
      '- Add specific data points (percentages, counts, timestamps) where available',
      '- Prioritize error categories: Database > Authentication > Network > External API > others',
      '',
      'OUTPUT: Return ONLY the HTML content, no explanations or markdown.',
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
