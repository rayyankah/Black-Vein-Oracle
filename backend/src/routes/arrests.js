import { Router } from 'express';
import pool from '../database/connection.js';

// Arrest records routes with raw SQL

const router = Router();

// Get all arrests
router.get('/', async (_req, res) => {
  try {
    const sql = `
      SELECT ar.*, 
             c.full_name AS criminal_name,
             t.name AS thana_name
      FROM arrest_records ar
      LEFT JOIN criminals c ON c.criminal_id = ar.criminal_id
      LEFT JOIN thanas t ON t.thana_id = ar.thana_id
      ORDER BY ar.arrest_date DESC;
    `;
    const { rows } = await pool.query(sql);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching arrests:', err);
    res.status(500).json({ error: 'Failed to fetch arrests' });
  }
});

// Get arrest by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `
      SELECT ar.*, 
             c.full_name AS criminal_name,
             t.name AS thana_name
      FROM arrest_records ar
      LEFT JOIN criminals c ON c.criminal_id = ar.criminal_id
      LEFT JOIN thanas t ON t.thana_id = ar.thana_id
      WHERE ar.arrest_id = $1;
    `;
    const { rows } = await pool.query(sql, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Arrest record not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching arrest:', err);
    res.status(500).json({ error: 'Failed to fetch arrest' });
  }
});

// Create arrest record
router.post('/', async (req, res) => {
  try {
    const { criminal_id, thana_id, arrest_date, bail_due_date, custody_status, case_reference } = req.body;
    
    // Start transaction to also update criminal status
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Insert arrest record
      const arrestSql = `
        INSERT INTO arrest_records (criminal_id, thana_id, arrest_date, bail_due_date, custody_status, case_reference)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;
      `;
      const { rows: arrestRows } = await client.query(arrestSql, [
        criminal_id, thana_id, arrest_date, bail_due_date, custody_status || 'in_custody', case_reference
      ]);
      
      // Update criminal status based on custody status
      const updateCriminalSql = `
        UPDATE criminals 
        SET status = $1 
        WHERE criminal_id = $2;
      `;
      await client.query(updateCriminalSql, [custody_status || 'in_custody', criminal_id]);
      
      await client.query('COMMIT');
      res.status(201).json(arrestRows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error creating arrest:', err);
    if (err.message && err.message.includes('bail_due_date')) {
      return res.status(400).json({ error: 'Bail due date must be after arrest date' });
    }
    res.status(500).json({ error: 'Failed to create arrest record' });
  }
});

// Update arrest record (status change)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { custody_status, bail_due_date } = req.body;
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Update arrest record
      const arrestSql = `
        UPDATE arrest_records 
        SET custody_status = COALESCE($1, custody_status),
            bail_due_date = COALESCE($2, bail_due_date)
        WHERE arrest_id = $3
        RETURNING *;
      `;
      const { rows: arrestRows } = await client.query(arrestSql, [custody_status, bail_due_date, id]);
      
      if (arrestRows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Arrest record not found' });
      }
      
      // Update criminal status if custody_status changed
      if (custody_status) {
        const updateCriminalSql = `
          UPDATE criminals 
          SET status = $1 
          WHERE criminal_id = $2;
        `;
        await client.query(updateCriminalSql, [custody_status, arrestRows[0].criminal_id]);
      }
      
      await client.query('COMMIT');
      res.json(arrestRows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error updating arrest:', err);
    res.status(500).json({ error: 'Failed to update arrest record' });
  }
});

// Get arrest stats
router.get('/stats', async (_req, res) => {
  try {
    const sql = `
      SELECT 
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE custody_status = 'in_custody') AS in_custody,
        COUNT(*) FILTER (WHERE custody_status = 'on_bail') AS on_bail,
        COUNT(*) FILTER (WHERE custody_status = 'released') AS released
      FROM arrest_records;
    `;
    const { rows } = await pool.query(sql);
    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching arrest stats:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
