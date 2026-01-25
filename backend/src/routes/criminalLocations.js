import { Router } from 'express';
import pool from '../database/connection.js';

const router = Router();

// Get all criminal locations (with criminal info)
router.get('/', async (_req, res) => {
  try {
    const sql = `
      SELECT cl.*, c.full_name, l.district, l.thana, l.address
      FROM criminal_locations cl
      JOIN criminals c ON c.criminal_id = cl.criminal_id
      JOIN locations l ON l.location_id = cl.location_id
      ORDER BY cl.seen_at DESC;
    `;
    const { rows } = await pool.query(sql);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching criminal locations:', err);
    res.status(500).json({ error: 'Failed to fetch criminal locations' });
  }
});

// Get location history for specific criminal
router.get('/criminal/:criminalId', async (req, res) => {
  try {
    const { criminalId } = req.params;
    const sql = `
      SELECT cl.*, l.district, l.thana, l.address, l.lat, l.lng
      FROM criminal_locations cl
      JOIN locations l ON l.location_id = cl.location_id
      WHERE cl.criminal_id = $1
      ORDER BY cl.seen_at DESC;
    `;
    const { rows } = await pool.query(sql, [criminalId]);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching criminal location history:', err);
    res.status(500).json({ error: 'Failed to fetch location history' });
  }
});

// Get criminals by location (which criminals were seen in an area)
router.get('/location/:locationId', async (req, res) => {
  try {
    const { locationId } = req.params;
    const sql = `
      SELECT cl.*, c.full_name, c.alias, c.risk_level, c.photo_url
      FROM criminal_locations cl
      JOIN criminals c ON c.criminal_id = cl.criminal_id
      WHERE cl.location_id = $1
      ORDER BY cl.seen_at DESC;
    `;
    const { rows } = await pool.query(sql, [locationId]);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching criminals by location:', err);
    res.status(500).json({ error: 'Failed to fetch criminals by location' });
  }
});

// Get criminals by district
router.get('/district/:district', async (req, res) => {
  try {
    const { district } = req.params;
    const sql = `
      SELECT DISTINCT c.*, l.district, l.thana, cl.seen_at
      FROM criminal_locations cl
      JOIN criminals c ON c.criminal_id = cl.criminal_id
      JOIN locations l ON l.location_id = cl.location_id
      WHERE l.district ILIKE $1
      ORDER BY cl.seen_at DESC;
    `;
    const { rows } = await pool.query(sql, [`%${district}%`]);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching criminals by district:', err);
    res.status(500).json({ error: 'Failed to fetch criminals by district' });
  }
});

// Log criminal sighting (add location record)
router.post('/', async (req, res) => {
  try {
    const { criminal_id, location_id, source } = req.body;
    const sql = `
      INSERT INTO criminal_locations (criminal_id, location_id, seen_at, source)
      VALUES ($1, $2, NOW(), $3)
      RETURNING *;
    `;
    const { rows } = await pool.query(sql, [criminal_id, location_id, source || 'manual']);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error logging criminal location:', err);
    res.status(500).json({ error: 'Failed to log criminal location' });
  }
});

// Create new location and log criminal sighting
router.post('/with-location', async (req, res) => {
  try {
    const { criminal_id, district, thana, address, lat, lng, source } = req.body;
    
    // Create location first
    const locationSql = `
      INSERT INTO locations (district, thana, address, lat, lng)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING location_id;
    `;
    const { rows: locRows } = await pool.query(locationSql, [district, thana, address, lat, lng]);
    const location_id = locRows[0].location_id;
    
    // Now log criminal sighting
    const sightingSql = `
      INSERT INTO criminal_locations (criminal_id, location_id, seen_at, source)
      VALUES ($1, $2, NOW(), $3)
      RETURNING *;
    `;
    const { rows } = await pool.query(sightingSql, [criminal_id, location_id, source || 'manual']);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error creating location and logging sighting:', err);
    res.status(500).json({ error: 'Failed to log criminal location' });
  }
});

// Delete location record
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `DELETE FROM criminal_locations WHERE id = $1 RETURNING *;`;
    const { rows } = await pool.query(sql, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Location record not found' });
    }
    res.json({ message: 'Location record deleted', record: rows[0] });
  } catch (err) {
    console.error('Error deleting location record:', err);
    res.status(500).json({ error: 'Failed to delete location record' });
  }
});

export default router;
