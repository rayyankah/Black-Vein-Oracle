import { Router } from 'express';
import pool from '../database/connection.js';

const router = Router();

// Get all bail records
router.get('/', async (_req, res) => {
  try {
    const sql = `
      SELECT br.*,
             c.full_name AS criminal_name,
             ar.case_reference,
             t.name AS thana_name
      FROM bail_records br
      JOIN arrest_records ar ON ar.arrest_id = br.arrest_id
      JOIN criminals c ON c.criminal_id = ar.criminal_id
      LEFT JOIN thanas t ON t.thana_id = ar.thana_id
      ORDER BY br.granted_at DESC NULLS LAST;
    `;
    const { rows } = await pool.query(sql);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching bail records:', err);
    res.status(500).json({ error: 'Failed to fetch bail records' });
  }
});

// Get active bail records (granted status)
router.get('/active', async (_req, res) => {
  try {
    const sql = `
      SELECT br.*,
             c.full_name AS criminal_name,
             c.risk_level,
             ar.case_reference
      FROM bail_records br
      JOIN arrest_records ar ON ar.arrest_id = br.arrest_id
      JOIN criminals c ON c.criminal_id = ar.criminal_id
      WHERE br.status = 'granted'
      ORDER BY br.granted_at DESC;
    `;
    const { rows } = await pool.query(sql);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching active bail records:', err);
    res.status(500).json({ error: 'Failed to fetch active bail records' });
  }
});

// Get bail record by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `
      SELECT br.*,
             c.full_name AS criminal_name,
             c.nid_or_alias,
             c.risk_level,
             ar.case_reference,
             ar.arrest_date,
             t.name AS thana_name
      FROM bail_records br
      JOIN arrest_records ar ON ar.arrest_id = br.arrest_id
      JOIN criminals c ON c.criminal_id = ar.criminal_id
      LEFT JOIN thanas t ON t.thana_id = ar.thana_id
      WHERE br.bail_id = $1;
    `;
    const { rows } = await pool.query(sql, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Bail record not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching bail record:', err);
    res.status(500).json({ error: 'Failed to fetch bail record' });
  }
});

// Create bail record (with transaction)
router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    const { arrest_id, court_name, bail_amount, granted_at, surety_name, status } = req.body;
    
    await client.query('BEGIN');
    
    // Get criminal_id from arrest record
    const arrestResult = await client.query(
      `SELECT criminal_id FROM arrest_records WHERE arrest_id = $1;`,
      [arrest_id]
    );
    
    if (arrestResult.rows.length === 0) {
      throw new Error('Arrest record not found');
    }
    
    const criminal_id = arrestResult.rows[0].criminal_id;
    
    // Create bail record - matches schema columns
    const sql = `
      INSERT INTO bail_records (arrest_id, court_name, bail_amount, granted_at, surety_name, status)
      VALUES ($1, $2, $3, $4, $5, COALESCE($6, 'pending'))
      RETURNING *;
    `;
    const { rows } = await client.query(sql, [
      arrest_id, court_name, bail_amount, granted_at, surety_name, status
    ]);
    
    // If status is granted, update criminal status
    if (status === 'granted') {
      await client.query(
        `UPDATE criminals SET status = 'on_bail' WHERE criminal_id = $1;`,
        [criminal_id]
      );
      
      // Update arrest record custody status
      await client.query(
        `UPDATE arrest_records SET custody_status = 'on_bail' WHERE arrest_id = $1;`,
        [arrest_id]
      );
      
      // If there's an active incarceration, release them
      await client.query(
        `UPDATE incarcerations 
         SET released_at = COALESCE($1::timestamptz, NOW())
         WHERE arrest_id = $2 AND released_at IS NULL;`,
        [granted_at, arrest_id]
      );
    }
    
    await client.query('COMMIT');
    res.status(201).json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating bail record:', err);
    res.status(500).json({ error: err.message || 'Failed to create bail record' });
  } finally {
    client.release();
  }
});

// Update bail record (e.g., update status)
router.put('/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { bail_amount, surety_name, status, court_name, granted_at } = req.body;
    
    await client.query('BEGIN');
    
    const sql = `
      UPDATE bail_records 
      SET bail_amount = COALESCE($1, bail_amount),
          surety_name = COALESCE($2, surety_name),
          status = COALESCE($3, status),
          court_name = COALESCE($4, court_name),
          granted_at = COALESCE($5, granted_at)
      WHERE bail_id = $6
      RETURNING *;
    `;
    const { rows } = await client.query(sql, [bail_amount, surety_name, status, court_name, granted_at, id]);
    
    if (rows.length === 0) {
      throw new Error('Bail record not found');
    }
    
    // If status changed to granted, update criminal status
    if (status === 'granted') {
      const arrestResult = await client.query(
        `SELECT criminal_id FROM arrest_records WHERE arrest_id = $1;`,
        [rows[0].arrest_id]
      );
      
      if (arrestResult.rows.length > 0) {
        await client.query(
          `UPDATE criminals SET status = 'on_bail' WHERE criminal_id = $1;`,
          [arrestResult.rows[0].criminal_id]
        );
      }
    }
    
    await client.query('COMMIT');
    res.json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error updating bail record:', err);
    res.status(500).json({ error: err.message || 'Failed to update bail record' });
  } finally {
    client.release();
  }
});

// Revoke bail (update status to rejected)
router.post('/:id/revoke', async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    
    await client.query('BEGIN');
    
    // Get bail record with arrest info
    const bailResult = await client.query(
      `SELECT br.*, ar.criminal_id 
       FROM bail_records br
       JOIN arrest_records ar ON ar.arrest_id = br.arrest_id
       WHERE br.bail_id = $1;`,
      [id]
    );
    
    if (bailResult.rows.length === 0) {
      throw new Error('Bail record not found');
    }
    
    // Update bail record status to rejected
    const sql = `
      UPDATE bail_records 
      SET status = 'rejected'
      WHERE bail_id = $1
      RETURNING *;
    `;
    const { rows } = await client.query(sql, [id]);
    
    // Update criminal status back to in_custody
    await client.query(
      `UPDATE criminals SET status = 'in_custody' WHERE criminal_id = $1;`,
      [bailResult.rows[0].criminal_id]
    );
    
    // Update arrest record status
    await client.query(
      `UPDATE arrest_records SET custody_status = 'in_custody' WHERE arrest_id = $1;`,
      [bailResult.rows[0].arrest_id]
    );
    
    await client.query('COMMIT');
    res.json({ message: 'Bail revoked', bail: rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error revoking bail:', err);
    res.status(500).json({ error: err.message || 'Failed to revoke bail' });
  } finally {
    client.release();
  }
});

// Delete bail record
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `DELETE FROM bail_records WHERE bail_id = $1 RETURNING *;`;
    const { rows } = await pool.query(sql, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Bail record not found' });
    }
    res.json({ message: 'Bail record deleted', bail: rows[0] });
  } catch (err) {
    console.error('Error deleting bail record:', err);
    res.status(500).json({ error: 'Failed to delete bail record' });
  }
});

// Get bail statistics
router.get('/stats/summary', async (_req, res) => {
  try {
    const sql = `
      SELECT 
        COUNT(*) AS total_bails,
        COUNT(*) FILTER (WHERE status = 'granted') AS granted_bails,
        COUNT(*) FILTER (WHERE status = 'pending') AS pending_bails,
        COUNT(*) FILTER (WHERE status = 'rejected') AS rejected_bails,
        SUM(bail_amount) AS total_bail_amount,
        AVG(bail_amount)::numeric(12,2) AS avg_bail_amount
      FROM bail_records;
    `;
    const { rows } = await pool.query(sql);
    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching bail stats:', err);
    res.status(500).json({ error: 'Failed to fetch bail stats' });
  }
});

export default router;
