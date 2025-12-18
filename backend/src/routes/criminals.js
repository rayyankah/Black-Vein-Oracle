import { Router } from 'express';
import pool from '../database/connection.js';
import { searchCriminals } from '../queries/predictive_queries.js';

// Criminal management with advanced FTS search and dossier updates.

const router = Router();

router.post('/', async (req, res) => {
	const { primary_name, nationality, dossier } = req.body;
	const sql = `
		INSERT INTO criminals (primary_name, nationality, dossier)
		VALUES ($1,$2,$3)
		RETURNING *;
	`;
	const { rows } = await pool.query(sql, [primary_name, nationality, dossier]);
	res.json(rows[0]);
});

router.get('/search', async (req, res) => {
	const { q } = req.query;
	const rows = await searchCriminals(q || '', 25);
	res.json(rows);
});

router.get('/', async (_req, res) => {
	const { rows } = await pool.query(`SELECT * FROM criminals ORDER BY created_at DESC LIMIT 100;`);
	res.json(rows);
});

export default router;
