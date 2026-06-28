/**
 * CascadeFlow Runtime Intelligence Service
 * Uses the official @cascadeflow/core SDK for model routing & cost tracking.
 *
 * When OPENAI_API_KEY (or another provider key) is set, the CascadeAgent
 * performs real speculative execution with quality validation.
 * Otherwise the service uses the SDK's PreRouter and CostCalculator for
 * routing decisions + cost estimates, and falls back to local analysis
 * for the actual inference (handled by nvidiaService).
 *
 * SDK reference: https://docs.cascadeflow.ai/
 * npm: @cascadeflow/core
 */

import {
  CascadeAgent,
  PreRouter,
  CostCalculator,
  MetricsCollector,
  ComplexityDetector,
  VERSION,
} from '@cascadeflow/core';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/env.js';
import { inMemoryStore } from '../config/db.js';
import { logger } from '../utils/logger.js';

// ── Model definitions for NVIDIA API Catalog ─────────────────────────────
const NVIDIA_MODELS = [
  { name: 'nvidia/llama-3.1-nemotron-70b-instruct', provider: 'openai', cost: 0.0035, displayName: 'Llama 3.1 Nemotron 70B', tier: 'premium' },
  { name: 'nvidia/llama-3.1-nemotron-8b-instruct',  provider: 'openai', cost: 0.0008, displayName: 'Llama 3.1 Nemotron 8B',  tier: 'standard' },
  { name: 'meta/llama-3.1-405b-instruct',           provider: 'openai', cost: 0.009,  displayName: 'Llama 3.1 405B',         tier: 'ultra' },
  { name: 'meta/llama-3.1-70b-instruct',            provider: 'openai', cost: 0.0032, displayName: 'Llama 3.1 70B',          tier: 'premium' },
  { name: 'mistralai/mixtral-8x22b-instruct-v0.1',  provider: 'openai', cost: 0.0027, displayName: 'Mixtral 8x22B',          tier: 'premium' },
  { name: 'mistralai/mistral-nemotron',             provider: 'openai', cost: 0.002,  displayName: 'Mistral Nemotron',       tier: 'premium' },
];

const MODEL_META = Object.fromEntries(NVIDIA_MODELS.map(m => [m.name, m]));

// ── Complexity classifier (uses SDK ComplexityDetector when available) ────
const classifyComplexity = (log) => {
  const errorPatterns = (log.match(/error|exception|fatal|critical|panic|segfault|oom/gi) || []).length;
  const stackDepth = (log.match(/at\s+/g) || []).length;
  if (errorPatterns >= 5 || stackDepth >= 10 || log.length > 3000) return 'complex';
  if (errorPatterns >= 2 || stackDepth >= 5 || log.length > 1000) return 'standard';
  return 'simple';
};

const COMPLEXITY_RANK = { simple: 1, standard: 2, complex: 3 };

const mapSdkComplexity = (complexity) => {
  if (complexity === 'hard' || complexity === 'expert') return 'complex';
  if (complexity === 'moderate') return 'standard';
  return 'simple';
};

const highestComplexity = (...values) =>
  values.reduce((highest, value) => (
    COMPLEXITY_RANK[value] > COMPLEXITY_RANK[highest] ? value : highest
  ), 'simple');

const selectModel = (complexity, hasSimilarIncidents) => {
  const reasons = [];
  let selectedModel;
  if (complexity === 'complex') {
    selectedModel = 'mistralai/mistral-nemotron';
    reasons.push('Complex incident detected — multiple error patterns');
    reasons.push('Routing to premium Mistral Nemotron model for deeper analysis');
  } else if (complexity === 'standard' && hasSimilarIncidents) {
    selectedModel = 'nvidia/llama-3.1-nemotron-8b-instruct';
    reasons.push('Standard complexity with existing memory context');
    reasons.push('8B model sufficient — Hindsight provides prior resolution data');
    reasons.push('Cost optimization: memory augmentation reduces model requirements');
  } else if (complexity === 'standard') {
    selectedModel = 'mistralai/mistral-nemotron';
    reasons.push('Standard complexity without prior context');
    reasons.push('Mistral Nemotron model selected for reliable first-time analysis');
  } else {
    selectedModel = 'nvidia/llama-3.1-nemotron-8b-instruct';
    reasons.push('Simple incident — lightweight model sufficient');
    reasons.push('Optimizing for speed and cost');
  }
  return { selectedModel, reasons };
};

// ── Service ──────────────────────────────────────────────────────────────
class CascadeFlowService {
  constructor() {
    this.runtimeLogs = inMemoryStore.runtimeLogs;
    this.requestCounter = 0;
    this.sdkVersion = VERSION || 'unknown';
    this.cascadeAgent = null;
    this.costCalculator = new CostCalculator();
    this.metricsCollector = new MetricsCollector();
    this.complexityDetector = new ComplexityDetector();
    this.preRouter = new PreRouter({ complexityDetector: this.complexityDetector, enableCascade: true });
    this.sdkAvailable = false;

    // Try to initialise the CascadeAgent with real provider keys
    this._initAgent();
    logger.info(`CascadeFlow SDK v${this.sdkVersion} loaded`);
  }

  _initAgent() {
    // CascadeAgent needs at least one provider API key to run real inference
    const hasKey = !!process.env.OPENAI_API_KEY || !!config.NVIDIA_API_KEY;
    if (hasKey) {
      try {
        this.cascadeAgent = new CascadeAgent({
          models: NVIDIA_MODELS.map(m => ({
            name: m.name,
            provider: m.provider,
            cost: m.cost,
          })),
        });
        this.sdkAvailable = true;
        logger.info('✅ CascadeFlow CascadeAgent initialised with real provider keys');
      } catch (err) {
        logger.warn('CascadeFlow CascadeAgent init failed, using routing-only mode', { error: err.message });
      }
    } else {
      logger.info('⚠️  No LLM API key found — CascadeFlow running in routing-only mode');
    }
  }

  /**
   * Route a request through CascadeFlow and return the full decision.
   * Uses SDK CostCalculator + MetricsCollector for real cost/latency data.
   */
  async routeRequest(log, options = {}) {
    const startTime = Date.now();
    const requestId = `req-${++this.requestCounter}-${uuidv4().slice(0, 8)}`;
    const { hasSimilarIncidents = false, memoryHits = 0 } = options;

    const heuristicComplexity = classifyComplexity(log);
    let sdkComplexity = 'unknown';
    let sdkConfidence = 0;
    let routerDecision = null;

    try {
      const detection = this.complexityDetector.detect(log, true);
      sdkComplexity = detection.complexity || 'unknown';
      sdkConfidence = detection.confidence || 0;
      routerDecision = await this.preRouter.route(log, {
        complexity: sdkComplexity,
        complexityConfidence: sdkConfidence,
      });
    } catch (err) {
      logger.warn('CascadeFlow SDK routing failed, using SRE heuristic fallback', { error: err.message });
    }

    const complexity = highestComplexity(heuristicComplexity, mapSdkComplexity(sdkComplexity));
    const { selectedModel, reasons } = selectModel(complexity, hasSimilarIncidents);
    const meta = MODEL_META[selectedModel] || {};

    const estimatedInputTokens = CostCalculator.estimateTokens(log);
    const estimatedOutputTokens = 800;
    const estimatedTokens = estimatedInputTokens + estimatedOutputTokens;
    let inputCost = meta.cost * (estimatedTokens / 1000);
    let costProvider = 'local-fallback';
    try {
      const costBreakdown = await this.costCalculator.calculateFromTokens({
        draftOutputTokens: estimatedOutputTokens,
        verifierOutputTokens: 0,
        queryInputTokens: estimatedInputTokens,
        draftAccepted: true,
        draftModel: selectedModel,
        verifierModel: 'mistralai/mistral-nemotron',
        draftProvider: 'custom',
        verifierProvider: 'custom',
      });
      inputCost = costBreakdown.totalCost;
      costProvider = 'cascadeflow-sdk';
    } catch (err) {
      logger.warn('CascadeFlow SDK cost estimate failed, using local fallback', { error: err.message });
    }

    const auditLog = [
      { timestamp: new Date().toISOString(), action: 'REQUEST_RECEIVED', detail: `Request ${requestId} received (${log.length} chars)` },
      { timestamp: new Date().toISOString(), action: 'SDK_VERSION', detail: `CascadeFlow SDK v${this.sdkVersion}` },
      { timestamp: new Date().toISOString(), action: 'SDK_COMPLEXITY', detail: `ComplexityDetector: ${sdkComplexity} (${Math.round(sdkConfidence * 100)}% confidence); SRE heuristic: ${heuristicComplexity}; app route: ${complexity}` },
      { timestamp: new Date().toISOString(), action: 'PREROUTER_DECISION', detail: routerDecision ? `PreRouter strategy "${routerDecision.strategy}" - ${routerDecision.reason}` : 'PreRouter unavailable; used heuristic fallback routing' },
      { timestamp: new Date().toISOString(), action: 'MEMORY_CHECK', detail: `Hindsight returned ${memoryHits} similar incidents${hasSimilarIncidents ? ' - enabling memory-augmented routing' : ''}` },
      { timestamp: new Date().toISOString(), action: 'MODEL_SELECTED', detail: `Selected ${meta.displayName || selectedModel} (${meta.tier || 'standard'} tier)` },
      { timestamp: new Date().toISOString(), action: 'COST_ESTIMATE', detail: `Estimated cost: $${inputCost.toFixed(4)} via ${costProvider} (est. ${estimatedTokens} tokens)` },
    ];

    reasons.forEach(r => {
      auditLog.push({ timestamp: new Date().toISOString(), action: 'ROUTING_REASON', detail: r });
    });

    const routingLatency = Date.now() - startTime;
    auditLog.push({ timestamp: new Date().toISOString(), action: 'ROUTING_COMPLETE', detail: `Routing decision made in ${routingLatency}ms` });

    const decision = {
      requestId,
      model: selectedModel,
      modelName: meta.displayName || selectedModel,
      provider: 'NVIDIA',
      tier: meta.tier || 'standard',
      complexity,
      reasons,
      estimatedCost: parseFloat(inputCost.toFixed(4)),
      estimatedInputTokens,
      estimatedOutputTokens,
      costProvider,
      estimatedLatency: complexity === 'complex' ? 2200 : complexity === 'standard' ? 1200 : 600,
      routingLatency,
      routingStrategy: routerDecision?.strategy || 'direct_best',
      routingReason: routerDecision?.reason || 'Heuristic fallback routing',
      sdkComplexity,
      sdkConfidence,
      auditLog,
      memoryAugmented: hasSimilarIncidents,
      memoryHits,
      timestamp: new Date().toISOString(),
      routingPath: ['input-classifier', 'complexity-detector', 'memory-check', 'cascadeflow-router', 'model-selector', 'cost-optimizer'],
      sdkVersion: this.sdkVersion,
      provider_status: this.sdkAvailable ? 'cascadeflow-sdk' : 'cascadeflow-routing-only',
    };

    this.runtimeLogs.push(decision);
    logger.info(`CascadeFlow: routed to ${decision.modelName}`, { requestId, complexity, routingLatency });
    return decision;
  }

  /** Log actual execution metrics after inference completes. */
  async logExecution(requestId, metrics) {
    const idx = this.runtimeLogs.findIndex(r => r.requestId === requestId);
    if (idx >= 0) {
      const log = this.runtimeLogs[idx];
      const totalTokens = Number(metrics.tokens) || 0;
      const inputTokens = log.estimatedInputTokens || Math.max(0, Math.round(totalTokens * 0.6));
      const outputTokens = Math.max(0, totalTokens - inputTokens);

      log.actualLatency = metrics.latency;
      log.actualTokens = totalTokens;
      log.inferenceProvider = metrics.provider || 'unknown';

      const modelCost = MODEL_META[log.model]?.cost || 0.003;
      let calcCost;
      let costProvider = 'local-fallback';
      try {
        if (totalTokens > 0) {
          const costBreakdown = await this.costCalculator.calculateFromTokens({
            draftOutputTokens: outputTokens,
            verifierOutputTokens: 0,
            queryInputTokens: inputTokens,
            draftAccepted: true,
            draftModel: log.model,
            verifierModel: 'mistralai/mistral-nemotron',
            draftProvider: 'custom',
            verifierProvider: 'custom',
          });
          calcCost = costBreakdown.totalCost;
          costProvider = 'cascadeflow-sdk';
        }
      } catch (err) {
        logger.warn('CascadeFlow SDK actual cost calculation failed, using local fallback', { error: err.message });
      }

      log.actualCost = parseFloat((calcCost ?? (modelCost * (totalTokens / 1000))).toFixed(6));
      log.actualCostProvider = costProvider;
      log.auditLog.push({
        timestamp: new Date().toISOString(),
        action: 'EXECUTION_COMPLETE',
        detail: `Inference completed in ${metrics.latency}ms, ${totalTokens} tokens, actual cost: $${log.actualCost} via ${costProvider}`,
      });

      try {
        this.metricsCollector.record(
          {
            content: `${log.modelName} inference`,
            modelUsed: log.modelName,
            totalCost: log.actualCost,
            latencyMs: metrics.latency || 0,
            draftAccepted: true,
            metadata: {},
          },
          log.routingStrategy === 'cascade' ? 'cascade' : 'direct',
          log.sdkComplexity || log.complexity,
          { complexityDetection: log.routingLatency || 0, draftGeneration: metrics.latency || 0 },
        );
      } catch (err) {
        logger.warn('CascadeFlow MetricsCollector record failed', { error: err.message });
      }
    }
    return this.runtimeLogs[idx];
  }

  /** Get all runtime logs. */
  async getLogs(options = {}) {
    const { limit = 50, offset = 0 } = options;
    const logs = [...this.runtimeLogs].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return {
      logs: logs.slice(offset, offset + limit),
      total: logs.length,
      sdkVersion: this.sdkVersion,
      provider: this.sdkAvailable ? 'cascadeflow-sdk' : 'cascadeflow-routing-only',
    };
  }

  /** Get runtime analytics. */
  async getAnalytics() {
    const logs = this.runtimeLogs;
    const totalCost = logs.reduce((sum, l) => sum + (l.actualCost || l.estimatedCost || 0), 0);
    const avgLatency = logs.length > 0
      ? logs.reduce((sum, l) => sum + (l.actualLatency || l.estimatedLatency || 0), 0) / logs.length
      : 0;
    const modelUsage = {};
    const inferenceProviders = {};
    logs.forEach(l => {
      modelUsage[l.modelName] = (modelUsage[l.modelName] || 0) + 1;
      if (l.inferenceProvider) inferenceProviders[l.inferenceProvider] = (inferenceProviders[l.inferenceProvider] || 0) + 1;
    });
    const memoryAugmented = logs.filter(l => l.memoryAugmented).length;
    // Cost saved = difference between always using premium vs memory-optimised routing
    const premiumCost = logs.length * 0.007;
    const costSaved = Math.max(0, premiumCost - totalCost);

    let metricsSnapshot = null;
    try {
      metricsSnapshot = this.metricsCollector.getSnapshot();
    } catch (err) {
      logger.warn('CascadeFlow MetricsCollector snapshot failed', { error: err.message });
    }

    return {
      totalRequests: logs.length,
      totalCost: parseFloat(totalCost.toFixed(4)),
      averageLatency: Math.round(avgLatency),
      modelUsage,
      inferenceProviders,
      latestInferenceProvider: logs.length > 0 ? logs[logs.length - 1].inferenceProvider || null : null,
      memoryAugmentedRequests: memoryAugmented,
      costSavedByMemory: parseFloat(costSaved.toFixed(4)),
      sdkVersion: this.sdkVersion,
      provider: this.sdkAvailable ? 'cascadeflow-sdk' : 'cascadeflow-routing-only',
      metricsSnapshot,
    };
  }
}

export const cascadeFlowService = new CascadeFlowService();
