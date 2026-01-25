import { Router } from 'express';
import pool from '../database/connection.js';

// Criminal Organizations (Gangs) routes with raw SQL

const router = Router();

// Get all organizations
router.get('/', async (_req, res) => {
  try {
    const sql = `
      SELECT o.*,
             COUNT(co.criminal_id) AS member_count
      FROM organizations o
      LEFT JOIN criminal_organizations co ON co.org_id = o.org_id
      GROUP BY o.org_id
      ORDER BY o.threat_level DESC, o.name;
    `;
    const { rows } = await pool.query(sql);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching organizations:', err);
    res.status(500).json({ error: 'Failed to fetch organizations' });
  }
});

// Get organization by ID with members
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get organization
    const orgSql = `SELECT * FROM organizations WHERE org_id = $1;`;
    const { rows: orgRows } = await pool.query(orgSql, [id]);
    
    if (orgRows.length === 0) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    
    // Get members
    const membersSql = `
      SELECT c.*, co.role
      FROM criminal_organizations co
      JOIN criminals c ON c.criminal_id = co.criminal_id
      WHERE co.org_id = $1
      ORDER BY c.risk_level DESC;
    `;
    const { rows: members } = await pool.query(membersSql, [id]);
    
    res.json({
      ...orgRows[0],
      members
    });
  } catch (err) {
    console.error('Error fetching organization:', err);
    res.status(500).json({ error: 'Failed to fetch organization' });
  }
});

// Create organization
router.post('/', async (req, res) => {
  try {
    const { name, ideology, threat_level } = req.body;
    const sql = `
      INSERT INTO organizations (name, ideology, threat_level)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const { rows } = await pool.query(sql, [name, ideology, threat_level]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error creating organization:', err);
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Organization name already exists' });
    }
    res.status(500).json({ error: 'Failed to create organization' });
  }
});

// Update organization
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, ideology, threat_level } = req.body;
    const sql = `
      UPDATE organizations 
      SET name = COALESCE($1, name),
          ideology = COALESCE($2, ideology),
          threat_level = COALESCE($3, threat_level)
      WHERE org_id = $4
      RETURNING *;
    `;
    const { rows } = await pool.query(sql, [name, ideology, threat_level, id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Error updating organization:', err);
    res.status(500).json({ error: 'Failed to update organization' });
  }
});

// Delete organization
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `DELETE FROM organizations WHERE org_id = $1 RETURNING *;`;
    const { rows } = await pool.query(sql, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    res.json({ message: 'Organization deleted', organization: rows[0] });
  } catch (err) {
    console.error('Error deleting organization:', err);
    res.status(500).json({ error: 'Failed to delete organization' });
  }
});

// Add criminal to organization
router.post('/:id/members', async (req, res) => {
  try {
    const { id } = req.params;
    const { criminal_id, role } = req.body;
    const sql = `
      INSERT INTO criminal_organizations (criminal_id, org_id, role)
      VALUES ($1, $2, $3)
      ON CONFLICT (criminal_id, org_id) DO UPDATE SET role = $3
      RETURNING *;
    `;
    const { rows } = await pool.query(sql, [criminal_id, id, role]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error adding member:', err);
    res.status(500).json({ error: 'Failed to add member' });
  }
});

// Remove criminal from organization
router.delete('/:id/members/:criminalId', async (req, res) => {
  try {
    const { id, criminalId } = req.params;
    const sql = `
      DELETE FROM criminal_organizations 
      WHERE org_id = $1 AND criminal_id = $2
      RETURNING *;
    `;
    const { rows } = await pool.query(sql, [id, criminalId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Membership not found' });
    }
    res.json({ message: 'Member removed' });
  } catch (err) {
    console.error('Error removing member:', err);
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

export default router;
