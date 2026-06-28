import { Router } from 'express';
import { hindsightService } from '../services/hindsightService.js';

const router = Router();

// POST /api/memory/save
router.post('/save', async (req, res, next) => {
  try {
    const { type, content, summary, incidentId, tags, metadata } = req.body;
    if (!content) {
      return res.status(400).json({ success: false, error: 'Content is required' });
    }
    const result = await hindsightService.store({ type, content, summary, incidentId, tags, metadata });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// GET /api/memory/search?q=...&limit=5&type=incident
router.get('/search', async (req, res, next) => {
  try {
    const { q, limit = 5, type } = req.query;
    if (!q) {
      return res.status(400).json({ success: false, error: 'Query parameter "q" is required' });
    }
    const result = await hindsightService.search(q, {
      limit: parseInt(limit, 10),
      type: type || null,
    });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// GET /api/memory - get all memories
router.get('/', async (req, res, next) => {
  try {
    const { type, limit = 50, offset = 0 } = req.query;
    const result = await hindsightService.getAll({
      type: type || null,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
    });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// GET /api/memory/stats
router.get('/stats', async (req, res, next) => {
  try {
    const stats = await hindsightService.getStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
});

export default router;
