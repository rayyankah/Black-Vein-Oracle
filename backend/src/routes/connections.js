import { Router } from 'express';
import pool from '../database/connection.js';
import { getNetworkPaths } from '../queries/criminal_network.js';

// Connections router: exposes the recursive CTE graph mapping for the HQ interface.

const router = Router();

router.post('/', async (req, res) => {
	const { source_id, target_id, relation_type, strength } = req.body;
	const sql = `
		INSERT INTO relationships (source_id, target_id, relation_type, strength)
		VALUES ($1,$2,$3,$4)
		ON CONFLICT (source_id, target_id, relation_type) DO UPDATE
			SET strength = EXCLUDED.strength, last_seen = NOW()
		RETURNING *;
	`;
	const { rows } = await pool.query(sql, [source_id, target_id, relation_type, strength]);
	res.json(rows[0]);
});

// Recursive mapping up to 6 degrees for visualization
router.get('/:criminalId/map', async (req, res) => {
	const { criminalId } = req.params;
	const data = await getNetworkPaths(criminalId, 6);
	res.json(data);
});

export default router;
