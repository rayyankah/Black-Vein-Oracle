import { Router } from 'express';
import pool from '../database/connection.js';

const router = Router();

// Get all GD reports
router.get('/', async (_req, res) => {
  try {
    const sql = `
      SELECT gd.*, 
             u.full_name AS user_name,
             t.name AS thana_name,
             o.full_name AS approved_by_officer_name
      FROM gd_reports gd
      LEFT JOIN users u ON u.user_id = gd.user_id
      LEFT JOIN thanas t ON t.thana_id = gd.thana_id
      LEFT JOIN officers o ON o.officer_id = gd.approved_by_officer_id
      ORDER BY gd.submitted_at DESC;
    `;
    const { rows } = await pool.query(sql);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching GD reports:', err);
    res.status(500).json({ error: 'Failed to fetch GD reports' });
  }
});

// Get GD report by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `
      SELECT gd.*, 
             u.full_name AS user_name,
             t.name AS thana_name,
             o.full_name AS approved_by_officer_name
      FROM gd_reports gd
      LEFT JOIN users u ON u.user_id = gd.user_id
      LEFT JOIN thanas t ON t.thana_id = gd.thana_id
      LEFT JOIN officers o ON o.officer_id = gd.approved_by_officer_id
      WHERE gd.gd_id = $1;
    `;
    const { rows } = await pool.query(sql, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'GD report not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching GD report:', err);
    res.status(500).json({ error: 'Failed to fetch GD report' });
  }
});

// Create GD report (citizen submission)
router.post('/', async (req, res) => {
  try {
    const { user_id, thana_id, description } = req.body;
    
    // For demo purposes, create or get a demo user if user_id not provided
    let finalUserId = user_id;
    if (!finalUserId) {
      const userSql = `
        INSERT INTO users (full_name, nid_number, phone, email, password_hash)
        VALUES ('Demo Citizen', 'DEMO-' || floor(random() * 1000000)::text, '01700000000', 
                'demo' || floor(random() * 1000000)::text || '@example.com', 'demo_hash')
        ON CONFLICT (nid_number) DO UPDATE SET full_name = users.full_name
        RETURNING user_id;
      `;
      const { rows: userRows } = await pool.query(userSql);
      finalUserId = userRows[0].user_id;
    }
    
    const sql = `
      INSERT INTO gd_reports (user_id, thana_id, description, status)
      VALUES ($1, $2, $3, 'submitted')
      RETURNING *;
    `;
    const { rows } = await pool.query(sql, [finalUserId, thana_id, description]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error creating GD report:', err);
    res.status(500).json({ error: 'Failed to create GD report' });
  }
});

// Update GD report status (approve/reject)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, approved_by_officer_id } = req.body;
    
    if (!['submitted', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const sql = `
      UPDATE gd_reports 
      SET status = $1,
          approved_by_officer_id = $2
      WHERE gd_id = $3
      RETURNING *;
    `;
    const { rows } = await pool.query(sql, [status, approved_by_officer_id, id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'GD report not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Error updating GD report:', err);
    res.status(500).json({ error: 'Failed to update GD report' });
  }
});

// Get GD status summary
router.get('/summary/status', async (_req, res) => {
  try {
    const sql = `SELECT * FROM v_gd_status_summary;`;
    const { rows } = await pool.query(sql);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching GD summary:', err);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

export default router;
