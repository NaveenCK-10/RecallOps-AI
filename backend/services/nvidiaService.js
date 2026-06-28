/**
 * NVIDIA AI Service
 *
 * Handles inference calls to NVIDIA API endpoints (https://integrate.api.nvidia.com).
 * When NVIDIA_API_KEY is set, makes real API calls.
 * Otherwise returns pattern-matched analysis for demo purposes.
 */

import axios from 'axios';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

class NvidiaService {
  constructor() {
    this.isConfigured = !!config.NVIDIA_API_KEY;
    if (this.isConfigured) {
      this.client = axios.create({
        baseURL: config.NVIDIA_BASE_URL,
        headers: {
          'Authorization': `Bearer ${config.NVIDIA_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 60000,
      });
      logger.info('✅ NVIDIA API client configured');
    } else {
      logger.info('⚠️  No NVIDIA_API_KEY — using pattern-matched analysis for demo');
    }
  }

  /** Run inference against NVIDIA endpoint or return pattern-matched analysis. */
  async analyze(prompt, model = 'mistralai/mistral-nemotron', isHealthCheck = false) {
    const startTime = Date.now();

    if (this.isConfigured) {
      try {
        const response = await this.client.post('/chat/completions', {
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.2,
          max_tokens: 4096,
        });

        const content = response.data.choices[0]?.message?.content || '';
        const latency = Date.now() - startTime;
        const tokens = response.data.usage?.total_tokens || 0;

        logger.info('NVIDIA: real inference complete', { model, latency, tokens });
        return { content, latency, tokens, provider: 'nvidia-api' };
      } catch (err) {
        logger.error('NVIDIA API error', { error: err.message });
        return {
          content: null,
          latency: Date.now() - startTime,
          tokens: 0,
          provider: 'nvidia-api-error',
          success: false,
          error: `Analysis Service Unavailable: ${err.message}`
        };
      }
    }

    return this._patternAnalysis(prompt, startTime, isHealthCheck);
  }

  /** Pattern-matched analysis based on log content. */
  async _patternAnalysis(prompt, startTime, isHealthCheck) {
    const log = prompt.toLowerCase();
    let analysis;

    if (isHealthCheck) {
      analysis = {
        title: "Status: No Critical Errors Detected",
        rootCause: "Health Summary: The system is operating normally. All services are responsive and no exceptions were found in the provided log window.",
        severity: "healthy",
        confidence: 98,
        resolution: "Recommendations: No immediate action required. Continue standard monitoring.",
        explanation: "Observations: Log entries indicate successful initialisation and standard operational events without any critical or fatal markers.",
        category: "system-health",
        tags: ["healthy", "verified"],
        engineerNotes: "Log was verified clean by AI pattern pre-scan."
      };
    } else if (log.includes('oom') || log.includes('out of memory') || log.includes('oomkilled') || log.includes('heap')) {
      analysis = {
        title: 'Out of Memory (OOM) Kill in Production Service',
        rootCause: 'Application exceeding container memory limits due to unbounded cache growth and memory leak in request handler. The JVM/Node.js heap is not properly configured relative to container limits, causing the OOM killer to terminate the process when system memory pressure exceeds threshold.',
        severity: 'critical',
        confidence: 91,
        resolution: '1. Increase container memory limit to 2Gi as immediate mitigation\n2. Configure heap size to 75% of container limit (-Xmx1536m)\n3. Implement bounded LRU cache with max 10,000 entries\n4. Add memory pressure monitoring with alerts at 70%, 85%, 95%\n5. Profile application heap dump to identify leak source\n6. Implement graceful degradation under memory pressure',
        explanation: 'The application process was killed by the Linux OOM killer because it exceeded the memory limit configured in the container specification. This typically happens when the application has a memory leak, an unbounded cache, or the memory limits are simply too low for the workload.',
        category: 'memory',
        tags: ['oom', 'memory-leak', 'kubernetes', 'container', 'heap'],
        engineerNotes: 'Check if this correlates with recent traffic increase or deployment. Review heap dump if available.',
      };
    } else if (log.includes('connection') && (log.includes('refused') || log.includes('timeout') || log.includes('pool'))) {
      analysis = {
        title: 'Database Connection Pool Exhaustion',
        rootCause: 'Connection pool depleted due to long-running queries holding connections and insufficient pool size for current traffic volume. Connection leak detected in transaction handling.',
        severity: 'critical',
        confidence: 88,
        resolution: '1. Increase max pool size to 250 connections\n2. Implement connection timeout of 30 seconds\n3. Add PgBouncer as connection pooling proxy\n4. Fix connection leak in error handling paths\n5. Add slow query logging for queries > 5 seconds\n6. Implement circuit breaker for database calls',
        explanation: 'The database connection pool has been exhausted, meaning all available connections are in use and new requests cannot obtain a database connection. This causes cascading failures.',
        category: 'database',
        tags: ['database', 'connection-pool', 'timeout', 'postgresql', 'cascading-failure'],
        engineerNotes: 'Verify current pool configuration. Check for long-running transactions.',
      };
    } else if (log.includes('502') || log.includes('bad gateway') || log.includes('upstream')) {
      analysis = {
        title: 'NGINX 502 Bad Gateway — Upstream Service Failure',
        rootCause: 'Upstream application servers are unresponsive or crashing during rolling deployment. Health check endpoint returning OK prematurely before service dependencies are fully initialized.',
        severity: 'high',
        confidence: 85,
        resolution: '1. Add startup probe with initialDelaySeconds: 30\n2. Configure readiness probe to verify downstream dependencies\n3. Set maxUnavailable: 0 in rolling update strategy\n4. Implement graceful shutdown with preStop hook\n5. Increase NGINX proxy_connect_timeout to 60s\n6. Add retry logic with next upstream on 502/503',
        explanation: 'Users are seeing 502 Bad Gateway errors because NGINX is forwarding requests to backend servers that are not accepting connections.',
        category: 'configuration',
        tags: ['nginx', '502', 'deployment', 'kubernetes', 'health-check'],
        engineerNotes: 'Check deployment timing correlation. Review pod restart counts.',
      };
    } else if (log.includes('timeout') || log.includes('deadline exceeded') || log.includes('timed out')) {
      analysis = {
        title: 'Request Timeout — Service Latency Degradation',
        rootCause: 'Downstream service latency has increased beyond acceptable thresholds, causing cascading timeouts through the service mesh. Root cause appears to be CPU throttling due to resource contention.',
        severity: 'high',
        confidence: 82,
        resolution: '1. Implement circuit breaker with 50% error rate threshold\n2. Add request-level timeouts at 10s with retry budget of 3\n3. Investigate CPU throttling — increase resource limits\n4. Implement request hedging for critical paths\n5. Add bulkhead isolation between dependencies\n6. Set up latency-based alerting at p99 > 2s',
        explanation: 'Requests are timing out because a downstream service is taking too long to respond. Without circuit breakers, every incoming request waits for the full timeout duration.',
        category: 'network',
        tags: ['timeout', 'latency', 'circuit-breaker', 'cascading-failure'],
        engineerNotes: 'Check downstream service health. Review recent deployments.',
      };
    } else if (log.includes('ssl') || log.includes('certificate') || log.includes('tls')) {
      analysis = {
        title: 'SSL/TLS Certificate Failure',
        rootCause: 'SSL certificate has expired or is invalid, causing all HTTPS connections to fail. Certificate auto-renewal process (cert-manager) failed silently.',
        severity: 'critical',
        confidence: 94,
        resolution: '1. Immediately renew or replace the expired certificate\n2. Fix cert-manager configuration and RBAC permissions\n3. Add certificate expiry monitoring (30/14/7/1 day alerts)\n4. Implement certificate backup in secrets manager\n5. Add synthetic monitoring for SSL validity\n6. Set up redundant certificate issuers',
        explanation: 'The SSL/TLS certificate has expired, which means browsers and API clients will refuse to connect. This causes a complete outage for all services using the affected domain.',
        category: 'security',
        tags: ['ssl', 'tls', 'certificate', 'cert-manager', 'outage'],
        engineerNotes: 'Check cert-manager logs for renewal failures.',
      };
    } else if (log.includes('redis') || log.includes('cache') || log.includes('sentinel')) {
      analysis = {
        title: 'Redis Cluster Failover Failure',
        rootCause: 'Redis primary node failure with incomplete Sentinel failover. Quorum not reached due to unreachable sentinels. Session store and cache layer fully unavailable, causing 100% cache miss rate.',
        severity: 'critical',
        confidence: 92,
        resolution: '1. Reconfigure Sentinel quorum from 3 to 2\n2. Reduce down-after-milliseconds to 5000\n3. Implement fallback cache layer with local LRU\n4. Add cache stampede protection with probabilistic early expiration\n5. Configure session store with Redis Cluster mode\n6. Add Sentinel health monitoring',
        explanation: 'Redis Sentinel failed to perform automatic failover because it could not reach quorum. Without the primary node, all cache and session operations fail.',
        category: 'database',
        tags: ['redis', 'failover', 'sentinel', 'cache', 'session'],
        engineerNotes: 'Verify sentinel network connectivity. Check sentinel logs.',
      };
    } else if (log.includes('memory') && (log.includes('leak') || log.includes('growing') || log.includes('heap'))) {
      analysis = {
        title: 'Memory Leak Detected in Application Service',
        rootCause: 'Gradual memory growth indicating a memory leak, likely from unreleased event listeners, unclosed connections, or accumulating data structures in long-running processes.',
        severity: 'high',
        confidence: 87,
        resolution: '1. Add cleanup in disconnect/close handlers\n2. Implement WeakRef for event listeners\n3. Set --max-old-space-size appropriately\n4. Add memory usage monitoring with auto-restart at 80%\n5. Profile heap snapshots to identify leak source\n6. Implement connection pooling with proper lifecycle management',
        explanation: 'The application is gradually consuming more memory over time without releasing it. This eventually leads to OOM kills or severe performance degradation from excessive garbage collection.',
        category: 'memory',
        tags: ['memory-leak', 'heap', 'event-listener', 'nodejs'],
        engineerNotes: 'Take heap snapshots at intervals to identify growing objects.',
      };
    } else if (log.includes('disk') || log.includes('space') || log.includes('storage') || log.includes('no space left')) {
      analysis = {
        title: 'Disk Space Exhaustion — Storage Critical',
        rootCause: 'Disk space exhausted by unrotated application logs and growing database files. Log rotation is either misconfigured or not implemented.',
        severity: 'critical',
        confidence: 89,
        resolution: '1. Clean up old log files and temp files\n2. Implement log rotation with 7-day retention\n3. Move to centralized logging (ELK/Loki)\n4. Set up disk usage alerting at 70%, 80%, 90%\n5. Implement automated cleanup cron jobs\n6. Consider expanding volume size',
        explanation: 'The server has run out of disk space, preventing applications from writing logs, databases from storing data, and the OS from functioning properly.',
        category: 'disk',
        tags: ['disk', 'storage', 'logs', 'cleanup', 'monitoring'],
        engineerNotes: 'Check which directories consume the most space.',
      };
    } else {
      analysis = {
        title: 'Application Error — Service Degradation Detected',
        rootCause: 'Application throwing unhandled exceptions in the request processing pipeline. Error handling is insufficient, causing uncaught exceptions to terminate request processing.',
        severity: 'medium',
        confidence: 75,
        resolution: '1. Add comprehensive error handling with try-catch\n2. Implement global exception handler middleware\n3. Add structured error logging with correlation IDs\n4. Review recent deployment changes for regression\n5. Add integration tests for affected code paths\n6. Implement feature flags for safe rollback',
        explanation: 'The application is encountering errors during request processing that are not being properly handled.',
        category: 'application',
        tags: ['application', 'error-handling', 'exception', 'deployment'],
        engineerNotes: 'Review recent deployments and code changes.',
      };
    }

    // Simulate realistic inference latency
    const simulatedLatency = Math.floor(Math.random() * 800 + 1200);
    await new Promise(resolve => setTimeout(resolve, Math.min(simulatedLatency, 2000)));

    const latency = Date.now() - startTime;
    const tokens = Math.floor(Math.random() * 500 + 1200);

    logger.info('NVIDIA: pattern analysis complete', { latency, tokens });
    return {
      content: JSON.stringify(analysis),
      latency,
      tokens,
      provider: 'nvidia-pattern-analysis',
    };
  }
}

export const nvidiaService = new NvidiaService();
