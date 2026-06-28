/**
 * Analysis Orchestrator Service
 * 
 * Coordinates the full incident analysis pipeline:
 * 1. Search Hindsight for similar incidents
 * 2. Route request through CascadeFlow
 * 3. Run NVIDIA inference with memory context
 * 4. Store results back into Hindsight memory
 * 5. Return complete analysis with runtime decisions
 */

import { v4 as uuidv4 } from 'uuid';
import { hindsightService } from './hindsightService.js';
import { cascadeFlowService } from './cascadeflowService.js';
import { nvidiaService } from './nvidiaService.js';
import { analysisPrompt } from '../prompts/analysisPrompt.js';
import { inMemoryStore } from '../config/db.js';
import { logger } from '../utils/logger.js';

class AnalysisService {
  async analyzeIncident(rawLog) {
    const incidentId = `INC-${Date.now().toString(36).toUpperCase()}-${uuidv4().slice(0, 4).toUpperCase()}`;
    const pipelineStart = Date.now();

    logger.info(`Starting analysis pipeline for ${incidentId}`);

    // ── Step 1: Search Hindsight for similar incidents ──────────────
    const memorySearch = await hindsightService.search(rawLog, {
      limit: 5,
      minSimilarity: 0.1,
    });

    const similarIncidents = memorySearch.results.map(mem => ({
      incidentId: mem.incidentId || mem.memoryId,
      title: mem.summary || 'Previous incident',
      similarity: mem.similarity,
      rootCause: mem.metadata?.category || 'Unknown',
      resolution: mem.metadata?.resolution || 'No resolution recorded',
      wasSuccessful: mem.metadata?.wasSuccessful ?? true,
      engineerNotes: mem.metadata?.engineer ? `Resolved by ${mem.metadata.engineer}` : '',
      timestamp: mem.createdAt,
    }));

    // ── Step 2: Route through CascadeFlow ───────────────────────────
    const runtimeDecision = await cascadeFlowService.routeRequest(rawLog, {
      hasSimilarIncidents: similarIncidents.length > 0,
      memoryHits: similarIncidents.length,
    });

    // ── Step 3: Run NVIDIA inference ────────────────────────────────
    const prompt = analysisPrompt(rawLog, similarIncidents);
    const inference = await nvidiaService.analyze(prompt, runtimeDecision.model);

    // Log execution metrics back to CascadeFlow
    await cascadeFlowService.logExecution(runtimeDecision.requestId, {
      latency: inference.latency,
      tokens: inference.tokens,
      provider: inference.provider,
    });

    // ── Step 4: Parse AI response ───────────────────────────────────
    let analysis;
    try {
      // Try to extract JSON from the response
      let content = inference.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) content = jsonMatch[0];
      analysis = JSON.parse(content);
    } catch (err) {
      logger.warn('Failed to parse AI response as JSON, using fallback', { error: err.message });
      analysis = {
        title: 'Production Incident Detected',
        rootCause: 'Analysis complete — review log details for specifics.',
        severity: 'medium',
        confidence: 70,
        resolution: 'Further investigation recommended.',
        explanation: inference.content.substring(0, 500),
        category: 'application',
        tags: ['needs-review'],
        engineerNotes: 'AI response required manual parsing.',
      };
    }

    // ── Step 5: Store incident in memory ────────────────────────────
    const incident = {
      incidentId,
      title: analysis.title,
      rawLog,
      severity: analysis.severity,
      status: 'investigating',
      rootCause: analysis.rootCause,
      resolution: analysis.resolution,
      explanation: analysis.explanation,
      confidence: analysis.confidence,
      category: analysis.category,
      tags: analysis.tags || [],
      engineerNotes: analysis.engineerNotes || '',
      similarIncidents,
      runtimeDecisions: {
        requestId: runtimeDecision.requestId,
        model: runtimeDecision.model,
        modelName: runtimeDecision.modelName,
        provider: runtimeDecision.provider,
        tier: runtimeDecision.tier,
        complexity: runtimeDecision.complexity,
        reasons: runtimeDecision.reasons,
        estimatedCost: runtimeDecision.estimatedCost,
        actualCost: runtimeDecision.actualCost || runtimeDecision.estimatedCost,
        estimatedLatency: runtimeDecision.estimatedLatency,
        actualLatency: inference.latency,
        routingLatency: runtimeDecision.routingLatency,
        routingPath: runtimeDecision.routingPath,
        memoryAugmented: runtimeDecision.memoryAugmented,
        memoryHits: runtimeDecision.memoryHits,
        tokens: inference.tokens,
        auditLog: runtimeDecision.auditLog,
      },
      createdAt: new Date().toISOString(),
      pipelineLatency: Date.now() - pipelineStart,
    };

    // Store in memory
    inMemoryStore.incidents.push(incident);

    // ── Step 6: Store in Hindsight memory ───────────────────────────
    await hindsightService.store({
      type: 'incident',
      content: `${analysis.title}. ${analysis.rootCause}. Log: ${rawLog.substring(0, 500)}`,
      summary: analysis.title,
      incidentId,
      tags: analysis.tags || [],
      metadata: {
        engineer: 'RecallOps AI',
        severity: analysis.severity,
        category: analysis.category,
        resolution: analysis.resolution,
        wasSuccessful: false, // Will be updated when resolved
        confidence: analysis.confidence,
      },
    });

    logger.info(`Analysis pipeline complete for ${incidentId}`, {
      pipelineLatency: incident.pipelineLatency,
      similarIncidents: similarIncidents.length,
      model: runtimeDecision.modelName,
    });

    return incident;
  }
}

export const analysisService = new AnalysisService();
