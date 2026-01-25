import { Router } from 'express';
import pool from '../database/connection.js';

// Officers routes with raw SQL

const router = Router();

// Get all officers
router.get('/', async (_req, res) => {
  try {
    const sql = `
      SELECT o.*, t.name AS thana_name, r.rank_name
      FROM officers o
      LEFT JOIN thanas t ON t.thana_id = o.thana_id
      LEFT JOIN ranks r ON r.rank_code = o.rank_code
      ORDER BY r.level DESC, o.full_name;
    `;
    const { rows } = await pool.query(sql);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching officers:', err);
    res.status(500).json({ error: 'Failed to fetch officers' });
  }
});

// Get officer by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `
      SELECT o.*, t.name AS thana_name, r.rank_name
      FROM officers o
      LEFT JOIN thanas t ON t.thana_id = o.thana_id
      LEFT JOIN ranks r ON r.rank_code = o.rank_code
      WHERE o.officer_id = $1;
    `;
    const { rows } = await pool.query(sql, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Officer not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching officer:', err);
    res.status(500).json({ error: 'Failed to fetch officer' });
  }
});

// Create officer
router.post('/', async (req, res) => {
  try {
    const { thana_id, rank_code, full_name, badge_no } = req.body;
    const sql = `
      INSERT INTO officers (thana_id, rank_code, full_name, badge_no)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const { rows } = await pool.query(sql, [thana_id, rank_code, full_name, badge_no]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error creating officer:', err);
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Badge number already exists' });
    }
    res.status(500).json({ error: 'Failed to create officer' });
  }
});

// Update officer
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { thana_id, rank_code, full_name, badge_no } = req.body;
    const sql = `
      UPDATE officers 
      SET thana_id = COALESCE($1, thana_id),
          rank_code = COALESCE($2, rank_code),
          full_name = COALESCE($3, full_name),
          badge_no = COALESCE($4, badge_no)
      WHERE officer_id = $5
      RETURNING *;
    `;
    const { rows } = await pool.query(sql, [thana_id, rank_code, full_name, badge_no, id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Officer not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Error updating officer:', err);
    res.status(500).json({ error: 'Failed to update officer' });
  }
});

// Delete officer
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `DELETE FROM officers WHERE officer_id = $1 RETURNING *;`;
    const { rows } = await pool.query(sql, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Officer not found' });
    }
    res.json({ message: 'Officer deleted', officer: rows[0] });
  } catch (err) {
    console.error('Error deleting officer:', err);
    res.status(500).json({ error: 'Failed to delete officer' });
  }
});

// Get all ranks
router.get('/ranks/all', async (_req, res) => {
  try {
    const sql = `SELECT * FROM ranks ORDER BY level;`;
    const { rows } = await pool.query(sql);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching ranks:', err);
    res.status(500).json({ error: 'Failed to fetch ranks' });
  }
});

export default router;
