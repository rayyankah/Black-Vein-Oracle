import { Router } from 'express';
import { getTimings } from '../utils/performance_logger.js';
import { detectAtRiskVictims } from '../queries/predictive_queries.js';

// Analytics endpoints: used by HQ/Analytics panel to visualize query performance and risk predictions.

const router = Router();

router.get('/performance', (_req, res) => {
  res.json(getTimings());
});

router.get('/at-risk', async (_req, res) => {
  const rows = await detectAtRiskVictims();
  res.json(rows);
});

export default router;
