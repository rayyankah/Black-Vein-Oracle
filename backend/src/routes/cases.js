import { Router } from 'express';
import pool from '../database/connection.js';

// Case files routes with raw SQL

const router = Router();

// Get all cases
router.get('/', async (_req, res) => {
  try {
    const sql = `
      SELECT cf.*, 
             c.full_name AS criminal_name,
             t.name AS thana_name
      FROM case_files cf
      LEFT JOIN criminals c ON c.criminal_id = cf.criminal_id
      LEFT JOIN thanas t ON t.thana_id = cf.thana_id
      ORDER BY cf.filed_at DESC;
    `;
    const { rows } = await pool.query(sql);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching cases:', err);
    res.status(500).json({ error: 'Failed to fetch cases' });
  }
});

// Get case by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `
      SELECT cf.*, 
             c.full_name AS criminal_name,
             t.name AS thana_name
      FROM case_files cf
      LEFT JOIN criminals c ON c.criminal_id = cf.criminal_id
      LEFT JOIN thanas t ON t.thana_id = cf.thana_id
      WHERE cf.case_id = $1;
    `;
    const { rows } = await pool.query(sql, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Case not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching case:', err);
    res.status(500).json({ error: 'Failed to fetch case' });
  }
});

// Create case file
router.post('/', async (req, res) => {
  try {
    const { case_number, criminal_id, thana_id, case_type, status } = req.body;
    const sql = `
      INSERT INTO case_files (case_number, criminal_id, thana_id, case_type, status)
      VALUES ($1, $2, $3, $4, COALESCE($5, 'open'))
      RETURNING *;
    `;
    const { rows } = await pool.query(sql, [case_number, criminal_id, thana_id, case_type, status]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error creating case:', err);
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Case number already exists' });
    }
    res.status(500).json({ error: 'Failed to create case' });
  }
});

// Update case status
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const sql = `
      UPDATE case_files 
      SET status = $1
      WHERE case_id = $2
      RETURNING *;
    `;
    const { rows } = await pool.query(sql, [status, id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Case not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Error updating case:', err);
    res.status(500).json({ error: 'Failed to update case' });
  }
});

// Delete case
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `DELETE FROM case_files WHERE case_id = $1 RETURNING *;`;
    const { rows } = await pool.query(sql, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Case not found' });
    }
    res.json({ message: 'Case deleted', case: rows[0] });
  } catch (err) {
    console.error('Error deleting case:', err);
    res.status(500).json({ error: 'Failed to delete case' });
  }
});

export default router;
