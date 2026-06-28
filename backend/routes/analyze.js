import { Router } from 'express';
import { analysisService } from '../services/analysisService.js';

const router = Router();

router.post('/', async (req, res, next) => {
  try {
    const { log } = req.body;
    if (!log || typeof log !== 'string' || !log.trim()) {
      return res.status(400).json({ success: false, error: 'Production log is required and must be a string' });
    }
    if (log.length > 10000000) {
      return res.status(400).json({ success: false, error: 'Payload exceeds maximum processing limit.' });
    }
    const result = await analysisService.analyzeIncident(log.trim());
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

export default router;
