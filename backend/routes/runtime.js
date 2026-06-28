import { Router } from 'express';
import { cascadeFlowService } from '../services/cascadeflowService.js';

const router = Router();

// GET /api/runtime
router.get('/', async (req, res, next) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const logs = await cascadeFlowService.getLogs({
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
    });
    const analytics = await cascadeFlowService.getAnalytics();
    res.json({
      success: true,
      data: { ...logs, analytics },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
