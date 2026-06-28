/**
 * Hindsight Memory Service — uses the official @vectorize-io/hindsight-client SDK.
 *
 * When HINDSIGHT_BASE_URL is configured (default: http://localhost:8888), all
 * retain / recall / listMemories calls go through the real Hindsight server.
 * If the server is unreachable, the service falls back to a local keyword-
 * similarity engine so the demo works without Docker.
 *
 * SDK reference: https://hindsight.vectorize.io/
 * npm: @vectorize-io/hindsight-client
 */

import { HindsightClient } from '@vectorize-io/hindsight-client';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/env.js';
import { inMemoryStore } from '../config/db.js';
import { logger } from '../utils/logger.js';

const BANK_ID = 'recallops-incidents';

// ── Keyword extraction (used for local fallback only) ────────────────────
const STOP_WORDS = new Set([
  'the','a','an','is','are','was','were','be','been','being','have','has',
  'had','do','does','did','will','would','could','should','may','might',
  'shall','can','need','to','of','in','for','on','with','at','by','from',
  'as','into','through','during','before','after','above','below','between',
  'out','off','over','under','again','further','then','once','here','there',
  'when','where','why','how','all','each','every','both','few','more',
  'most','other','some','such','no','nor','not','only','own','same','so',
  'than','too','very','just','because','but','and','or','if','while',
  'this','that','these','those','it','its',
]);

const extractKeywords = (text) =>
  text.toLowerCase().replace(/[^a-z0-9\s._-]/g, ' ').split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));

const jaccardSimilarity = (kw1, kw2) => {
  if (!kw1.length || !kw2.length) return 0;
  const s1 = new Set(kw1), s2 = new Set(kw2);
  const inter = [...s1].filter(k => s2.has(k));
  let score = inter.length / new Set([...s1, ...s2]).size;
  const techTerms = inter.filter(t =>
    /error|exception|timeout|crash|fail|oom|segfault|deadlock|leak|overflow|denied|refused|abort/.test(t),
  );
  return Math.min(score + techTerms.length * 0.05, 1);
};

// ── Service class ────────────────────────────────────────────────────────
class HindsightService {
  constructor() {
    this.localMemories = inMemoryStore.memories;
    this.sdkClient = null;
    this.sdkAvailable = false;

    // Try to initialise the official SDK client
    const baseUrl = config.HINDSIGHT_BASE_URL || 'http://localhost:8888';
    try {
      this.sdkClient = new HindsightClient({ baseUrl });
      logger.info(`Hindsight SDK client created → ${baseUrl}`);
    } catch (err) {
      logger.warn('Hindsight SDK client creation failed, using local fallback', { error: err.message });
    }

    // Seed demo data for local fallback
    if (this.localMemories.length === 0) this._seedDemoMemories();

    // Probe server availability asynchronously
    this._probeServer();
  }

  /** Ping the Hindsight server to determine if it's reachable. */
  async _probeServer() {
    if (!this.sdkClient) return;
    try {
      await this.sdkClient.getVersion();
      this.sdkAvailable = true;
      logger.info('✅ Hindsight server is reachable — using official SDK');
      // Ensure our bank exists
      try {
        await this.sdkClient.createBank(BANK_ID, {
          name: 'RecallOps Incidents',
          reflectMission: 'Recall prior production incidents, fixes, and engineering knowledge for RecallOps AI.',
          retainMission: 'Store concise incident root causes, resolutions, tags, and operational context.',
          enableObservations: true,
        });
        logger.info(`Hindsight bank "${BANK_ID}" ready`);
      } catch { /* bank may already exist */ }
      // Seed demo memories into Hindsight server
      await this._seedRemoteMemories();
    } catch (err) {
      this.sdkAvailable = false;
      logger.warn('⚠️  Hindsight server unreachable — using local fallback', { error: err.message });
    }
  }

  // ── Public API ─────────────────────────────────────────────────────────

  /** Store a memory (SDK: retain). */
  async store(memory) {
    const startTime = Date.now();
    const content = `[${memory.type || 'incident'}] ${memory.summary || ''}\n${memory.content}`;
    const context = memory.metadata ? JSON.stringify(memory.metadata) : undefined;

    // Always store locally for UI display
    const entry = {
      memoryId: memory.memoryId || uuidv4(),
      type: memory.type || 'incident',
      content: memory.content,
      summary: memory.summary || '',
      incidentId: memory.incidentId || null,
      tags: memory.tags || [],
      metadata: memory.metadata || {},
      keywords: extractKeywords(memory.content + ' ' + (memory.summary || '')),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      accessCount: 0,
    };
    this.localMemories.push(entry);

    // Attempt SDK retain
    let sdkUsed = false;
    if (this.sdkAvailable) {
      try {
        await this.sdkClient.retain(BANK_ID, content, { context });
        sdkUsed = true;
      } catch (err) {
        logger.warn('Hindsight SDK retain failed, stored locally only', { error: err.message });
      }
    }

    const latency = Date.now() - startTime;
    logger.info(`Hindsight: stored memory ${entry.memoryId}`, { latency, sdk: sdkUsed });

    return {
      memoryId: entry.memoryId,
      stored: true,
      latency,
      memoryCount: this.localMemories.length,
      provider: sdkUsed ? 'hindsight-sdk' : 'hindsight-local',
    };
  }

  /** Search memories (SDK: recall). */
  async search(query, options = {}) {
    const startTime = Date.now();
    const { limit = 5, type = null, minSimilarity = 0.80 } = options;

    // Try official SDK first
    if (this.sdkAvailable) {
      try {
        const response = await this.sdkClient.recall(BANK_ID, query, {
          types: type ? [type] : undefined,
        });
        const latency = Date.now() - startTime;
        const results = (response.results || response.items || response.memories || [])
          .map(mem => this._normalizeSdkMemory(mem))
          .slice(0, limit);

        logger.info(`Hindsight SDK recall: ${results.length} results`, { latency });
        return {
          results,
          query: query.substring(0, 100),
          totalMemories: results.length,
          searchLatency: latency,
          provider: 'hindsight-sdk',
        };
      } catch (err) {
        logger.warn('Hindsight SDK recall failed, falling back to local', { error: err.message });
      }
    }

    // Local fallback: keyword similarity
    const queryKw = extractKeywords(query);
    let results = this.localMemories
      .map(mem => ({ ...mem, similarity: jaccardSimilarity(queryKw, mem.keywords || extractKeywords(mem.content)) }))
      .filter(m => m.similarity >= minSimilarity)
      .filter(m => !type || m.type === type)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    results.forEach(r => {
      const idx = this.localMemories.findIndex(m => m.memoryId === r.memoryId);
      if (idx >= 0) { this.localMemories[idx].accessCount++; this.localMemories[idx].lastAccessedAt = new Date().toISOString(); }
    });

    const latency = Date.now() - startTime;
    logger.info(`Hindsight local search: ${results.length} results`, { latency });
    return { results, query: query.substring(0, 100), totalMemories: this.localMemories.length, searchLatency: latency, provider: 'hindsight-local' };
  }

  /** List all memories (SDK: listMemories). */
  async getAll(options = {}) {
    const { type = null, limit = 50, offset = 0 } = options;

    if (this.sdkAvailable) {
      try {
        const response = await this.sdkClient.listMemories(BANK_ID, { limit, offset, type: type || undefined });
        const memories = (response.items || response.results || response.memories || (Array.isArray(response) ? response : []))
          .map(mem => this._normalizeSdkMemory(mem))
          .filter(m => !type || m.type === type)
          .slice(offset, offset + limit);
        return { memories, total: response.total ?? memories.length, provider: 'hindsight-sdk' };
      } catch (err) {
        logger.warn('Hindsight SDK listMemories failed', { error: err.message });
      }
    }

    let results = [...this.localMemories];
    if (type) results = results.filter(m => m.type === type);
    results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return { memories: results.slice(offset, offset + limit), total: results.length, provider: 'hindsight-local' };
  }

  /** Get memory statistics. */
  async getStats() {
    const types = {};
    this.localMemories.forEach(m => { types[m.type] = (types[m.type] || 0) + 1; });
    return {
      totalMemories: this.localMemories.length,
      byType: types,
      oldestMemory: this.localMemories.length > 0
        ? this.localMemories.reduce((a, b) => new Date(a.createdAt) < new Date(b.createdAt) ? a : b).createdAt : null,
      newestMemory: this.localMemories.length > 0
        ? this.localMemories.reduce((a, b) => new Date(a.createdAt) > new Date(b.createdAt) ? a : b).createdAt : null,
      provider: this.sdkAvailable ? 'hindsight-sdk' : 'hindsight-local',
    };
  }

  // ── Seed helpers ───────────────────────────────────────────────────────

  async _seedRemoteMemories() {
    const seeds = this._getDemoSeeds();
    for (const s of seeds) {
      try {
        await this.sdkClient.retain(BANK_ID, `[${s.type}] ${s.summary}\n${s.content}`, {
          context: JSON.stringify(s.metadata),
        });
      } catch { /* ignore individual failures */ }
    }
    logger.info(`Hindsight SDK: seeded ${seeds.length} memories into bank "${BANK_ID}"`);
  }

  _seedDemoMemories() {
    const seeds = this._getDemoSeeds();
    seeds.forEach(seed => {
      this.localMemories.push({
        ...seed,
        keywords: extractKeywords(seed.content + ' ' + (seed.summary || '')),
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        accessCount: Math.floor(Math.random() * 10),
      });
    });
    logger.info(`Hindsight local: seeded ${seeds.length} demo memories`);
  }

  _normalizeSdkMemory(mem) {
    const content = mem.content || mem.text || mem.chunk_text || '';
    const metadata = mem.metadata || {};
    const summary = mem.summary || metadata.summary || content.substring(0, 120);
    return {
      memoryId: mem.memoryId || mem.id || mem.document_id || uuidv4(),
      content,
      summary,
      similarity: mem.score ?? mem.relevance ?? mem.similarity ?? 0.8,
      type: mem.type || metadata.type || 'incident',
      tags: mem.tags || [],
      metadata,
      createdAt: mem.created_at || mem.createdAt || mem.mentioned_at || mem.occurred_start || new Date().toISOString(),
    };
  }
  _getDemoSeeds() {
    return [
      { memoryId: 'mem-001', type: 'incident', content: 'PostgreSQL connection pool exhaustion. Max connections reached (100/100). Application throwing "FATAL: too many connections for role app_user". Multiple services competing for limited pool. Database CPU at 95%.', summary: 'Database connection pool exhaustion causing cascading failures across microservices', tags: ['postgresql','connection-pool','database','cascading-failure'], metadata: { engineer: 'Sarah Chen', severity: 'critical', category: 'database', resolution: 'Increased connection pool size from 100 to 250, implemented PgBouncer connection pooling proxy, added connection timeout of 30s, implemented circuit breaker pattern in service layer.', wasSuccessful: true, confidence: 92 } },
      { memoryId: 'mem-002', type: 'fix', content: 'Kubernetes OOMKilled pods in production. Container memory limit set to 512Mi but application using 800Mi+ during peak traffic. Java heap not properly configured. GC pressure causing latency spikes before OOM.', summary: 'K8s pods OOMKilled due to misconfigured memory limits and JVM heap settings', tags: ['kubernetes','oom','memory','java','jvm'], metadata: { engineer: 'Marcus Rodriguez', severity: 'high', category: 'memory', resolution: 'Set container memory limit to 1Gi, configured JVM with -Xmx768m -Xms512m, added -XX:+UseG1GC for better GC, implemented memory-aware autoscaling with HPA based on memory pressure.', wasSuccessful: true, confidence: 88 } },
      { memoryId: 'mem-003', type: 'incident', content: 'Redis cluster failover causing 30-second request timeouts. Sentinel not detecting primary failure. Session store unavailable. Users experiencing 502 errors across all endpoints. Cache stampede after recovery.', summary: 'Redis cluster failover failure causing extended downtime and cache stampede', tags: ['redis','failover','sentinel','cache','timeout'], metadata: { engineer: 'Priya Patel', severity: 'critical', category: 'database', resolution: 'Reconfigured Sentinel quorum from 3 to 2, reduced down-after-milliseconds to 5000, implemented fallback cache layer with local LRU, added cache stampede protection with probabilistic early expiration.', wasSuccessful: true, confidence: 95 } },
      { memoryId: 'mem-004', type: 'incident', content: 'NGINX 502 Bad Gateway errors during deployment. Rolling update causing all pods to restart simultaneously. Health check endpoint returning 200 before application fully initialized. Traffic routing to unready pods.', summary: 'NGINX 502 errors during Kubernetes rolling deployment due to premature health checks', tags: ['nginx','502','deployment','kubernetes','health-check'], metadata: { engineer: 'Alex Kim', severity: 'high', category: 'configuration', resolution: 'Added startupProbe with initialDelaySeconds: 30, configured readinessProbe to check actual service dependencies, set maxUnavailable: 0 and maxSurge: 1 in deployment strategy, implemented graceful shutdown handler.', wasSuccessful: true, confidence: 90 } },
      { memoryId: 'mem-005', type: 'fix', content: 'API rate limiting causing 429 errors for legitimate users. Third-party API (Stripe) throttling payment processing. Retry logic without exponential backoff causing thundering herd. Queue backing up with 50k+ pending transactions.', summary: 'API rate limiting cascade from third-party throttling with naive retry logic', tags: ['rate-limiting','api','stripe','retry','queue'], metadata: { engineer: 'Jordan Lee', severity: 'high', category: 'application', resolution: 'Implemented exponential backoff with jitter (base 1s, max 32s), added circuit breaker with 50% error threshold, implemented priority queue for payment retries, added rate limit headers monitoring and adaptive throttling.', wasSuccessful: true, confidence: 87 } },
      { memoryId: 'mem-006', type: 'note', content: 'SSL certificate expiry caused total outage for 45 minutes. Auto-renewal via cert-manager failed silently. No alerting on certificate expiration. Wildcard cert affected all subdomains simultaneously.', summary: 'SSL certificate expiry outage due to silent cert-manager failure', tags: ['ssl','certificate','outage','cert-manager','monitoring'], metadata: { engineer: 'Emily Park', severity: 'critical', category: 'security', resolution: 'Fixed cert-manager RBAC permissions, added certificate expiry monitoring with 30/14/7 day alerts, implemented certificate backup in Vault, added synthetic monitoring for SSL validity.', wasSuccessful: true, confidence: 96 } },
      { memoryId: 'mem-007', type: 'incident', content: 'Memory leak in Node.js application causing gradual performance degradation. Heap growing by 50MB/hour. Event listeners not being removed on WebSocket disconnect. Process hitting V8 heap limit after 16 hours.', summary: 'Node.js memory leak from orphaned WebSocket event listeners', tags: ['nodejs','memory-leak','websocket','heap','event-listener'], metadata: { engineer: 'Chris Anderson', severity: 'medium', category: 'memory', resolution: 'Added proper cleanup in WebSocket disconnect handler, implemented WeakRef for event listeners, added --max-old-space-size=4096 flag, set up memory usage monitoring with automatic restart at 80% threshold.', wasSuccessful: true, confidence: 91 } },
      { memoryId: 'mem-008', type: 'incident', content: 'Elasticsearch cluster red status. Primary shard allocation failed due to disk watermark exceeded (95%). Index writes blocked. Search latency increased from 50ms to 5000ms. Log ingestion pipeline backed up.', summary: 'Elasticsearch cluster failure from disk watermark breach blocking writes', tags: ['elasticsearch','disk','cluster','shard','search'], metadata: { engineer: 'Maria Garcia', severity: 'critical', category: 'disk', resolution: 'Deleted old indices (>30 days), increased disk watermark thresholds, implemented ILM policy with hot-warm-cold architecture, added disk usage alerting at 70/80/90%, set up curator for automated index management.', wasSuccessful: true, confidence: 93 } },
    ];
  }
}

export const hindsightService = new HindsightService();
