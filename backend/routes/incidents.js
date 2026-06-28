import { Router } from 'express';
import { inMemoryStore } from '../config/db.js';

const router = Router();

// GET /api/incidents
router.get('/', async (req, res, next) => {
  try {
    const { limit = 50, offset = 0, severity, status } = req.query;
    let incidents = [...inMemoryStore.incidents];
    if (severity) incidents = incidents.filter(i => i.severity === severity);
    if (status) incidents = incidents.filter(i => i.status === status);
    incidents.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({
      success: true,
      data: {
        incidents: incidents.slice(parseInt(offset, 10), parseInt(offset, 10) + parseInt(limit, 10)),
        total: incidents.length,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/incidents/:id
router.get('/:id', async (req, res, next) => {
  try {
    const incident = inMemoryStore.incidents.find(i => i.incidentId === req.params.id);
    if (!incident) {
      return res.status(404).json({ success: false, error: 'Incident not found' });
    }
    res.json({ success: true, data: incident });
  } catch (err) {
    next(err);
  }
});

export default router;
