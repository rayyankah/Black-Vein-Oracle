import { Router } from 'express';
import pool from '../database/connection.js';

// Incarceration management - demonstrates transactions and complex joins

const router = Router();

// Get all incarcerations
router.get('/', async (_req, res) => {
  try {
    const sql = `
      SELECT i.*,
             c.full_name AS criminal_name,
             j.name AS jail_name,
             cb.block_name,
             cl.cell_number,
             ar.case_reference
      FROM incarcerations i
      JOIN arrest_records ar ON ar.arrest_id = i.arrest_id
      JOIN criminals c ON c.criminal_id = ar.criminal_id
      JOIN jails j ON j.jail_id = i.jail_id
      LEFT JOIN cells cl ON cl.cell_id = i.cell_id
      LEFT JOIN cell_blocks cb ON cb.block_id = cl.block_id
      ORDER BY i.admitted_at DESC;
    `;
    const { rows } = await pool.query(sql);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching incarcerations:', err);
    res.status(500).json({ error: 'Failed to fetch incarcerations' });
  }
});

// Get active incarcerations only
router.get('/active', async (_req, res) => {
  try {
    const sql = `
      SELECT i.*,
             c.full_name AS criminal_name,
             c.risk_level,
             j.name AS jail_name,
             cb.block_name,
             cl.cell_number,
             CURRENT_DATE - i.admitted_at::date AS days_served
      FROM incarcerations i
      JOIN arrest_records ar ON ar.arrest_id = i.arrest_id
      JOIN criminals c ON c.criminal_id = ar.criminal_id
      JOIN jails j ON j.jail_id = i.jail_id
      LEFT JOIN cells cl ON cl.cell_id = i.cell_id
      LEFT JOIN cell_blocks cb ON cb.block_id = cl.block_id
      WHERE i.released_at IS NULL
      ORDER BY c.risk_level DESC, i.admitted_at;
    `;
    const { rows } = await pool.query(sql);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching active incarcerations:', err);
    res.status(500).json({ error: 'Failed to fetch active incarcerations' });
  }
});

// Get incarceration by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `
      SELECT i.*,
             c.full_name AS criminal_name,
             c.nid_or_alias,
             c.risk_level,
             j.name AS jail_name,
             j.jail_id,
             cb.block_name,
             cb.block_id,
             cl.cell_number,
             cl.cell_id,
             ar.case_reference,
             ar.arrest_date
      FROM incarcerations i
      JOIN arrest_records ar ON ar.arrest_id = i.arrest_id
      JOIN criminals c ON c.criminal_id = ar.criminal_id
      JOIN jails j ON j.jail_id = i.jail_id
      LEFT JOIN cells cl ON cl.cell_id = i.cell_id
      LEFT JOIN cell_blocks cb ON cb.block_id = cl.block_id
      WHERE i.incarceration_id = $1;
    `;
    const { rows } = await pool.query(sql, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Incarceration not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching incarceration:', err);
    res.status(500).json({ error: 'Failed to fetch incarceration' });
  }
});

// Create incarceration (with transaction)
router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    const { arrest_id, jail_id, cell_id } = req.body;
    
    await client.query('BEGIN');
    
    // Check if cell is available (if specified)
    if (cell_id) {
      const cellCheck = await client.query(
        `SELECT cl.cell_id, cl.capacity,
                (SELECT COUNT(*) FROM incarcerations i 
                 WHERE i.cell_id = cl.cell_id AND i.released_at IS NULL) AS current_occupancy
         FROM cells cl WHERE cl.cell_id = $1;`,
        [cell_id]
      );
      
      if (cellCheck.rows.length === 0) {
        throw new Error('Cell not found');
      }
      
      if (cellCheck.rows[0].current_occupancy >= cellCheck.rows[0].capacity) {
        throw new Error('Cell is at full capacity');
      }
    }
    
    // Create incarceration - matches schema columns
    const sql = `
      INSERT INTO incarcerations (arrest_id, jail_id, cell_id)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const { rows } = await client.query(sql, [arrest_id, jail_id, cell_id]);
    
    // Get criminal_id from arrest record and update status
    const arrestResult = await client.query(
      `SELECT criminal_id FROM arrest_records WHERE arrest_id = $1;`,
      [arrest_id]
    );
    
    if (arrestResult.rows.length > 0) {
      await client.query(
        `UPDATE criminals SET status = 'in_custody' WHERE criminal_id = $1;`,
        [arrestResult.rows[0].criminal_id]
      );
    }
    
    await client.query('COMMIT');
    res.status(201).json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating incarceration:', err);
    res.status(500).json({ error: err.message || 'Failed to create incarceration' });
  } finally {
    client.release();
  }
});

// Update incarceration (e.g., cell transfer)
router.put('/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { cell_id } = req.body;
    
    await client.query('BEGIN');
    
    // If changing cell, check capacity
    if (cell_id) {
      const cellCheck = await client.query(
        `SELECT cl.cell_id, cl.capacity,
                (SELECT COUNT(*) FROM incarcerations i 
                 WHERE i.cell_id = cl.cell_id AND i.released_at IS NULL) AS current_occupancy
         FROM cells cl WHERE cl.cell_id = $1;`,
        [cell_id]
      );
      
      if (cellCheck.rows.length === 0) {
        throw new Error('Cell not found');
      }
      
      if (cellCheck.rows[0].current_occupancy >= cellCheck.rows[0].capacity) {
        throw new Error('Cell is at full capacity');
      }
    }
    
    const sql = `
      UPDATE incarcerations 
      SET cell_id = COALESCE($1, cell_id)
      WHERE incarceration_id = $2
      RETURNING *;
    `;
    const { rows } = await client.query(sql, [cell_id, id]);
    
    if (rows.length === 0) {
      throw new Error('Incarceration not found');
    }
    
    await client.query('COMMIT');
    res.json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error updating incarceration:', err);
    res.status(500).json({ error: err.message || 'Failed to update incarceration' });
  } finally {
    client.release();
  }
});

// Release prisoner
router.post('/:id/release', async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    
    await client.query('BEGIN');
    
    // Get incarceration details with criminal_id from arrest_records
    const incResult = await client.query(
      `SELECT i.*, ar.criminal_id 
       FROM incarcerations i
       JOIN arrest_records ar ON ar.arrest_id = i.arrest_id
       WHERE i.incarceration_id = $1;`,
      [id]
    );
    
    if (incResult.rows.length === 0) {
      throw new Error('Incarceration not found');
    }
    
    if (incResult.rows[0].released_at) {
      throw new Error('Prisoner already released');
    }
    
    // Update incarceration with release date
    const sql = `
      UPDATE incarcerations 
      SET released_at = NOW()
      WHERE incarceration_id = $1
      RETURNING *;
    `;
    const { rows } = await client.query(sql, [id]);
    
    // Update criminal status
    await client.query(
      `UPDATE criminals SET status = 'released' WHERE criminal_id = $1;`,
      [incResult.rows[0].criminal_id]
    );
    
    await client.query('COMMIT');
    res.json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error releasing prisoner:', err);
    res.status(500).json({ error: err.message || 'Failed to release prisoner' });
  } finally {
    client.release();
  }
});

// Get cell occupancy summary
router.get('/cells/occupancy', async (_req, res) => {
  try {
    const sql = `
      SELECT j.jail_id, j.name AS jail_name,
             cb.block_id, cb.block_name,
             cl.cell_id, cl.cell_number, cl.capacity,
             COUNT(i.incarceration_id) AS current_occupancy,
             cl.capacity - COUNT(i.incarceration_id) AS available_slots
      FROM jails j
      JOIN cell_blocks cb ON cb.jail_id = j.jail_id
      JOIN cells cl ON cl.block_id = cb.block_id
      LEFT JOIN incarcerations i ON i.cell_id = cl.cell_id AND i.released_at IS NULL
      GROUP BY j.jail_id, j.name, cb.block_id, cb.block_name, cl.cell_id, cl.cell_number, cl.capacity
      ORDER BY j.name, cb.block_name, cl.cell_number;
    `;
    const { rows } = await pool.query(sql);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching cell occupancy:', err);
    res.status(500).json({ error: 'Failed to fetch cell occupancy' });
  }
});

// Get prisoners by jail
router.get('/jail/:jailId', async (req, res) => {
  try {
    const { jailId } = req.params;
    const sql = `
      SELECT i.*,
             c.full_name AS criminal_name,
             c.risk_level,
             cb.block_name,
             cl.cell_number,
             CURRENT_DATE - i.admitted_at::date AS days_served
      FROM incarcerations i
      JOIN arrest_records ar ON ar.arrest_id = i.arrest_id
      JOIN criminals c ON c.criminal_id = ar.criminal_id
      LEFT JOIN cells cl ON cl.cell_id = i.cell_id
      LEFT JOIN cell_blocks cb ON cb.block_id = cl.block_id
      WHERE i.jail_id = $1 AND i.released_at IS NULL
      ORDER BY cb.block_name, cl.cell_number;
    `;
    const { rows } = await pool.query(sql, [jailId]);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching jail prisoners:', err);
    res.status(500).json({ error: 'Failed to fetch jail prisoners' });
  }
});

export default router;
