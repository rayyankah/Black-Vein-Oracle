import { Router } from 'express';
import pool from '../database/connection.js';
import { getIncidentVelocity } from '../queries/timeline_analysis.js';

// Incident logging drives the bleeding metaphor: warning_level >= 7 triggers SQL alert -> WebSocket.

const router = Router();

router.post('/', async (req, res) => {
	const { title, description, occurred_at, location_id, recorded_by, warning_level } = req.body;
	const sql = `
		INSERT INTO incidents (title, description, occurred_at, location_id, recorded_by, warning_level)
		VALUES ($1,$2,$3,$4,$5,$6)
		RETURNING *;
	`;
	const { rows } = await pool.query(sql, [title, description, occurred_at, location_id, recorded_by, warning_level]);
	res.json(rows[0]);
});

// Attach participants to incidents
router.post('/:id/participants', async (req, res) => {
	const { id } = req.params;
	const { criminal_id, role } = req.body;
	const sql = `
		INSERT INTO incident_participants (incident_id, criminal_id, role)
		VALUES ($1,$2,$3)
		ON CONFLICT DO NOTHING
		RETURNING *;
	`;
	const { rows } = await pool.query(sql, [id, criminal_id, role]);
	res.json(rows[0]);
});

// Timeline slider data for a specific criminal
router.get('/:criminalId/timeline', async (req, res) => {
	const data = await getIncidentVelocity(req.params.criminalId);
	res.json(data);
});

export default router;
