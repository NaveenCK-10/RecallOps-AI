import { Router } from 'express';
import { inMemoryStore } from '../config/db.js';
import { hindsightService } from '../services/hindsightService.js';
import { cascadeFlowService } from '../services/cascadeflowService.js';

const router = Router();

// GET /api/analytics
router.get('/', async (req, res, next) => {
  try {
    const incidents = inMemoryStore.incidents;
    const memoryStats = await hindsightService.getStats();
    const runtimeAnalytics = await cascadeFlowService.getAnalytics();

    // Compute analytics
    const totalIncidents = incidents.length;
    const memoryHits = incidents.filter(i => i.similarIncidents && i.similarIncidents.length > 0).length;
    const avgResolutionTime = incidents.length > 0
      ? Math.round(incidents.reduce((sum, i) => sum + (i.pipelineLatency || 0), 0) / incidents.length)
      : 0;

    // Severity distribution
    const severityDist = { critical: 0, high: 0, medium: 0, low: 0 };
    incidents.forEach(i => { severityDist[i.severity] = (severityDist[i.severity] || 0) + 1; });

    // Category distribution
    const categories = {};
    incidents.forEach(i => {
      if (i.category) categories[i.category] = (categories[i.category] || 0) + 1;
    });

    // Estimated cost saved (memory-augmented requests used cheaper models)
    const costSaved = runtimeAnalytics.costSavedByMemory;

    // Most common tags
    const tagCounts = {};
    incidents.forEach(i => {
      (i.tags || []).forEach(t => { tagCounts[t] = (tagCounts[t] || 0) + 1; });
    });
    const topTags = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));

    res.json({
      success: true,
      data: {
        totalIncidents,
        memoryHits,
        memoryHitRate: totalIncidents > 0 ? ((memoryHits / totalIncidents) * 100).toFixed(1) : 0,
        avgResolutionTime,
        costSaved,
        totalCost: runtimeAnalytics.totalCost,
        severityDistribution: severityDist,
        categoryDistribution: categories,
        topTags,
        memoryStats,
        runtimeAnalytics,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
