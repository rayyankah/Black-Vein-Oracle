import { Router } from 'express';
import pool from '../database/connection.js';

const router = Router();

// Get all thanas
router.get('/', async (_req, res) => {
  try {
    const sql = `
      SELECT t.*, o.full_name AS head_officer_name
      FROM thanas t
      LEFT JOIN officers o ON o.officer_id = t.head_officer_id
      ORDER BY t.district, t.name;
    `;
    const { rows } = await pool.query(sql);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching thanas:', err);
    res.status(500).json({ error: 'Failed to fetch thanas' });
  }
});

// Get thana by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `
      SELECT t.*, o.full_name AS head_officer_name
      FROM thanas t
      LEFT JOIN officers o ON o.officer_id = t.head_officer_id
      WHERE t.thana_id = $1;
    `;
    const { rows } = await pool.query(sql, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Thana not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching thana:', err);
    res.status(500).json({ error: 'Failed to fetch thana' });
  }
});

// Create thana
router.post('/', async (req, res) => {
  try {
    const { name, district, address, created_by_admin_id } = req.body;
    
    // For demo purposes, we'll use a default admin if none provided
    const sql = `
      INSERT INTO thanas (name, district, address, created_by_admin_id)
      VALUES ($1, $2, $3, COALESCE($4, (SELECT admin_id FROM admin LIMIT 1)))
      RETURNING *;
    `;
    const { rows } = await pool.query(sql, [name, district, address, created_by_admin_id]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error creating thana:', err);
    res.status(500).json({ error: 'Failed to create thana' });
  }
});

// Update thana
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, district, address, head_officer_id } = req.body;
    const sql = `
      UPDATE thanas 
      SET name = COALESCE($1, name),
          district = COALESCE($2, district),
          address = COALESCE($3, address),
          head_officer_id = $4
      WHERE thana_id = $5
      RETURNING *;
    `;
    const { rows } = await pool.query(sql, [name, district, address, head_officer_id, id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Thana not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Error updating thana:', err);
    res.status(500).json({ error: 'Failed to update thana' });
  }
});

// Delete thana
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `DELETE FROM thanas WHERE thana_id = $1 RETURNING *;`;
    const { rows } = await pool.query(sql, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Thana not found' });
    }
    res.json({ message: 'Thana deleted', thana: rows[0] });
  } catch (err) {
    console.error('Error deleting thana:', err);
    res.status(500).json({ error: 'Failed to delete thana' });
  }
});

// Get case summary by thana (uses the view we created)
router.get('/case-summary', async (_req, res) => {
  try {
    const sql = `SELECT * FROM v_thana_case_summary ORDER BY thana_name;`;
    const { rows } = await pool.query(sql);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching case summary:', err);
    res.status(500).json({ error: 'Failed to fetch case summary' });
  }
});

export default router;
