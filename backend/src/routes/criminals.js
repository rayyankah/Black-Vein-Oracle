import { Router } from 'express';
import pool from '../database/connection.js';

// Criminals management with raw SQL - demonstrates FTS, indexes, and complex queries

const router = Router();

// Get all criminals
router.get('/', async (_req, res) => {
  try {
    const sql = `
      SELECT c.*, t.name AS thana_name
      FROM criminals c
      LEFT JOIN thanas t ON t.thana_id = c.registered_thana_id
      ORDER BY c.risk_level DESC, c.full_name;
    `;
    const { rows } = await pool.query(sql);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching criminals:', err);
    res.status(500).json({ error: 'Failed to fetch criminals' });
  }
});

// Search criminals (Full-Text Search demonstration)
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }
    
    // Using ILIKE for simple search, can be upgraded to FTS with tsvector
    const sql = `
      SELECT c.*, t.name AS thana_name
      FROM criminals c
      LEFT JOIN thanas t ON t.thana_id = c.registered_thana_id
      WHERE c.full_name ILIKE $1 
         OR c.nid_or_alias ILIKE $1
      ORDER BY c.risk_level DESC
      LIMIT 25;
    `;
    const { rows } = await pool.query(sql, [`%${q}%`]);
    res.json(rows);
  } catch (err) {
    console.error('Error searching criminals:', err);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Get criminal stats (placed before /:id to avoid conflict)
router.get('/stats', async (_req, res) => {
  try {
    const sql = `
      SELECT 
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'in_custody') AS in_custody,
        COUNT(*) FILTER (WHERE status = 'on_bail') AS on_bail,
        COUNT(*) FILTER (WHERE status = 'released') AS released,
        COUNT(*) FILTER (WHERE status = 'escaped') AS escaped,
        AVG(risk_level)::numeric(3,1) AS avg_risk_level
      FROM criminals;
    `;
    const { rows } = await pool.query(sql);
    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching criminal stats:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Get WANTED criminals list (Public API - escaped/high-risk)
router.get('/wanted', async (_req, res) => {
  try {
    const sql = `
      SELECT 
        c.criminal_id,
        c.full_name,
        c.nid_or_alias AS alias,
        c.risk_level,
        c.photo_url,
        c.status,
        t.name AS last_known_thana,
        t.district AS last_known_district,
        ar.arrest_date AS last_arrest_date,
        ar.charges AS last_charges
      FROM criminals c
      LEFT JOIN thanas t ON t.thana_id = c.registered_thana_id
      LEFT JOIN LATERAL (
        SELECT arrest_date, charges 
        FROM arrest_records 
        WHERE criminal_id = c.criminal_id 
        ORDER BY arrest_date DESC 
        LIMIT 1
      ) ar ON true
      WHERE c.status IN ('escaped', 'wanted', 'unknown')
         OR c.risk_level >= 4
      ORDER BY c.risk_level DESC, c.full_name;
    `;
    const { rows } = await pool.query(sql);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching wanted list:', err);
    res.status(500).json({ error: 'Failed to fetch wanted list' });
  }
});

// Get criminal by ID with related data
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get criminal details
    const criminalSql = `
      SELECT c.*, t.name AS thana_name
      FROM criminals c
      LEFT JOIN thanas t ON t.thana_id = c.registered_thana_id
      WHERE c.criminal_id = $1;
    `;
    const { rows: criminalRows } = await pool.query(criminalSql, [id]);
    
    if (criminalRows.length === 0) {
      return res.status(404).json({ error: 'Criminal not found' });
    }
    
    // Get related criminals (network)
    const relationsSql = `
      SELECT cr.*, 
             c1.full_name AS criminal_1_name,
             c2.full_name AS criminal_2_name
      FROM criminal_relations cr
      JOIN criminals c1 ON c1.criminal_id = cr.criminal_id_1
      JOIN criminals c2 ON c2.criminal_id = cr.criminal_id_2
      WHERE cr.criminal_id_1 = $1 OR cr.criminal_id_2 = $1;
    `;
    const { rows: relations } = await pool.query(relationsSql, [id]);
    
    // Get organization memberships
    const orgsSql = `
      SELECT co.*, o.name AS org_name, o.threat_level
      FROM criminal_organizations co
      JOIN organizations o ON o.org_id = co.org_id
      WHERE co.criminal_id = $1;
    `;
    const { rows: orgs } = await pool.query(orgsSql, [id]);
    
    // Get arrest history
    const arrestsSql = `
      SELECT ar.*, t.name AS thana_name
      FROM arrest_records ar
      LEFT JOIN thanas t ON t.thana_id = ar.thana_id
      WHERE ar.criminal_id = $1
      ORDER BY ar.arrest_date DESC;
    `;
    const { rows: arrests } = await pool.query(arrestsSql, [id]);
    
    res.json({
      ...criminalRows[0],
      relations,
      organizations: orgs,
      arrest_history: arrests
    });
  } catch (err) {
    console.error('Error fetching criminal:', err);
    res.status(500).json({ error: 'Failed to fetch criminal' });
  }
});

// Create criminal
router.post('/', async (req, res) => {
  try {
    const { full_name, nid_or_alias, status, risk_level, registered_thana_id } = req.body;
    const sql = `
      INSERT INTO criminals (full_name, nid_or_alias, status, risk_level, registered_thana_id)
      VALUES ($1, $2, COALESCE($3, 'unknown'), COALESCE($4, 1), $5)
      RETURNING *;
    `;
    const { rows } = await pool.query(sql, [full_name, nid_or_alias, status, risk_level, registered_thana_id]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error creating criminal:', err);
    res.status(500).json({ error: 'Failed to create criminal' });
  }
});

// Update criminal
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, nid_or_alias, status, risk_level, registered_thana_id } = req.body;
    const sql = `
      UPDATE criminals 
      SET full_name = COALESCE($1, full_name),
          nid_or_alias = COALESCE($2, nid_or_alias),
          status = COALESCE($3, status),
          risk_level = COALESCE($4, risk_level),
          registered_thana_id = $5
      WHERE criminal_id = $6
      RETURNING *;
    `;
    const { rows } = await pool.query(sql, [full_name, nid_or_alias, status, risk_level, registered_thana_id, id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Criminal not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Error updating criminal:', err);
    res.status(500).json({ error: 'Failed to update criminal' });
  }
});

// Delete criminal
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `DELETE FROM criminals WHERE criminal_id = $1 RETURNING *;`;
    const { rows } = await pool.query(sql, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Criminal not found' });
    }
    res.json({ message: 'Criminal deleted', criminal: rows[0] });
  } catch (err) {
    console.error('Error deleting criminal:', err);
    res.status(500).json({ error: 'Failed to delete criminal' });
  }
});

// Get criminal network (Recursive CTE demonstration)
router.get('/:id/network', async (req, res) => {
  try {
    const { id } = req.params;
    const maxDepth = parseInt(req.query.depth) || 3;
    
    // Recursive CTE to traverse criminal relationships
    const sql = `
      WITH RECURSIVE network AS (
        -- Base case: direct relations
        SELECT 
          cr.criminal_id_1 AS source,
          cr.criminal_id_2 AS target,
          cr.relation_type,
          1 AS depth,
          ARRAY[cr.criminal_id_1, cr.criminal_id_2] AS path
        FROM criminal_relations cr
        WHERE cr.criminal_id_1 = $1 OR cr.criminal_id_2 = $1
        
        UNION ALL
        
        -- Recursive case: indirect relations
        SELECT 
          n.target AS source,
          CASE 
            WHEN cr.criminal_id_1 = n.target THEN cr.criminal_id_2
            ELSE cr.criminal_id_1
          END AS target,
          cr.relation_type,
          n.depth + 1,
          n.path || CASE 
            WHEN cr.criminal_id_1 = n.target THEN cr.criminal_id_2
            ELSE cr.criminal_id_1
          END
        FROM network n
        JOIN criminal_relations cr 
          ON cr.criminal_id_1 = n.target OR cr.criminal_id_2 = n.target
        WHERE n.depth < $2
          AND NOT (CASE 
            WHEN cr.criminal_id_1 = n.target THEN cr.criminal_id_2
            ELSE cr.criminal_id_1
          END = ANY(n.path))
      )
      SELECT DISTINCT ON (target)
        n.source,
        n.target,
        n.relation_type,
        n.depth,
        c.full_name AS target_name,
        c.risk_level AS target_risk_level,
        c.status AS target_status
      FROM network n
      JOIN criminals c ON c.criminal_id = n.target
      ORDER BY n.target, n.depth;
    `;
    
    const { rows } = await pool.query(sql, [id, maxDepth]);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching criminal network:', err);
    res.status(500).json({ error: 'Failed to fetch network' });
  }
});

// Add relation between criminals
router.post('/relations', async (req, res) => {
  try {
    const { criminal_id_1, criminal_id_2, relation_type } = req.body;
    const sql = `
      INSERT INTO criminal_relations (criminal_id_1, criminal_id_2, relation_type)
      VALUES ($1, $2, $3)
      ON CONFLICT (criminal_id_1, criminal_id_2, relation_type) DO NOTHING
      RETURNING *;
    `;
    const { rows } = await pool.query(sql, [criminal_id_1, criminal_id_2, relation_type]);
    res.status(201).json(rows[0] || { message: 'Relation already exists' });
  } catch (err) {
    console.error('Error creating relation:', err);
    res.status(500).json({ error: 'Failed to create relation' });
  }
});

export default router;
