import { Router } from 'express';
import pool from '../database/connection.js';

// Users (Citizens) routes - for GD report filing

const router = Router();

// Get all users
router.get('/', async (_req, res) => {
  try {
    const sql = `
      SELECT user_id, full_name, nid_number, phone, address, email
      FROM users
      ORDER BY full_name;
    `;
    const { rows } = await pool.query(sql);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `
      SELECT user_id, full_name, nid_number, phone, address, email
      FROM users
      WHERE user_id = $1;
    `;
    const { rows } = await pool.query(sql, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get user's GD reports
    const gdSql = `
      SELECT gd.*, t.name AS thana_name
      FROM gd_reports gd
      LEFT JOIN thanas t ON t.thana_id = gd.thana_id
      WHERE gd.user_id = $1
      ORDER BY gd.submitted_at DESC;
    `;
    const { rows: gdReports } = await pool.query(gdSql, [id]);
    
    res.json({
      ...rows[0],
      gd_reports: gdReports
    });
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Register user (citizen)
router.post('/register', async (req, res) => {
  try {
    const { full_name, nid_number, phone, address, email, password } = req.body;
    
    // In production, hash the password properly with bcrypt
    const sql = `
      INSERT INTO users (full_name, nid_number, phone, address, email, password_hash)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING user_id, full_name, nid_number, phone, address, email;
    `;
    const { rows } = await pool.query(sql, [full_name, nid_number, phone, address, email, password]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error registering user:', err);
    if (err.code === '23505') {
      return res.status(400).json({ error: 'NID or Email already registered' });
    }
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// Update user
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, phone, address, email } = req.body;
    const sql = `
      UPDATE users 
      SET full_name = COALESCE($1, full_name),
          phone = COALESCE($2, phone),
          address = COALESCE($3, address),
          email = COALESCE($4, email)
      WHERE user_id = $5
      RETURNING user_id, full_name, nid_number, phone, address, email;
    `;
    const { rows } = await pool.query(sql, [full_name, phone, address, email, id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `DELETE FROM users WHERE user_id = $1 RETURNING user_id, full_name;`;
    const { rows } = await pool.query(sql, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User deleted', user: rows[0] });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;
