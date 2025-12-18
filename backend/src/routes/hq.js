import { Router } from 'express';
import { fetchOpenAlerts, markAlertHandled } from '../queries/realtime_alerts.js';
import { slowVsFast } from '../queries/optimization_demo.js';

// HQ dashboard endpoints: alerts, optimization demos, and performance evidence.

const router = Router();

router.get('/alerts', async (_req, res) => {
	const rows = await fetchOpenAlerts();
	res.json(rows);
});

router.post('/alerts/:id/handled', async (req, res) => {
	const updated = await markAlertHandled(req.params.id);
	res.json(updated);
});

// Demonstrate before/after optimization for graders
router.get('/optimization-demo', async (_req, res) => {
	const result = await slowVsFast();
	res.json(result);
});

export default router;
