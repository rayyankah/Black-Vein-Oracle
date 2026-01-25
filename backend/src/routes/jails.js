import { Router } from 'express';
import pool from '../database/connection.js';

const router = Router();

// Get all jails with blocks and cells
router.get('/', async (_req, res) => {
  try {
    // Get jails
    const jailsSql = `SELECT * FROM jails ORDER BY district, name;`;
    const { rows: jails } = await pool.query(jailsSql);
    
    // Get blocks for each jail
    const blocksSql = `SELECT * FROM cell_blocks ORDER BY jail_id, block_name;`;
    const { rows: blocks } = await pool.query(blocksSql);
    
    // Get cells for each block
    const cellsSql = `SELECT * FROM cells ORDER BY block_id, cell_number;`;
    const { rows: cells } = await pool.query(cellsSql);
    
    // Assemble the hierarchy
    const jailsWithBlocks = jails.map(jail => ({
      ...jail,
      blocks: blocks
        .filter(b => b.jail_id === jail.jail_id)
        .map(block => ({
          ...block,
          cells: cells.filter(c => c.block_id === block.block_id)
        }))
    }));
    
    res.json(jailsWithBlocks);
  } catch (err) {
    console.error('Error fetching jails:', err);
    res.status(500).json({ error: 'Failed to fetch jails' });
  }
});

// Get jail by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `SELECT * FROM jails WHERE jail_id = $1;`;
    const { rows } = await pool.query(sql, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Jail not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching jail:', err);
    res.status(500).json({ error: 'Failed to fetch jail' });
  }
});

// Create jail
router.post('/', async (req, res) => {
  try {
    const { name, district, address, capacity } = req.body;
    const sql = `
      INSERT INTO jails (name, district, address, capacity)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const { rows } = await pool.query(sql, [name, district, address, capacity]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error creating jail:', err);
    res.status(500).json({ error: 'Failed to create jail' });
  }
});

// Update jail
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, district, address, capacity } = req.body;
    const sql = `
      UPDATE jails 
      SET name = COALESCE($1, name),
          district = COALESCE($2, district),
          address = COALESCE($3, address),
          capacity = COALESCE($4, capacity)
      WHERE jail_id = $5
      RETURNING *;
    `;
    const { rows } = await pool.query(sql, [name, district, address, capacity, id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Jail not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Error updating jail:', err);
    res.status(500).json({ error: 'Failed to update jail' });
  }
});

// Delete jail
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `DELETE FROM jails WHERE jail_id = $1 RETURNING *;`;
    const { rows } = await pool.query(sql, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Jail not found' });
    }
    res.json({ message: 'Jail deleted', jail: rows[0] });
  } catch (err) {
    console.error('Error deleting jail:', err);
    res.status(500).json({ error: 'Failed to delete jail' });
  }
});

// Get cells for a jail
router.get('/:id/cells', async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `
      SELECT c.*, cb.block_name
      FROM cells c
      JOIN cell_blocks cb ON cb.block_id = c.block_id
      WHERE cb.jail_id = $1
      ORDER BY cb.block_name, c.cell_number;
    `;
    const { rows } = await pool.query(sql, [id]);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching cells:', err);
    res.status(500).json({ error: 'Failed to fetch cells' });
  }
});

// Create cell block
router.post('/blocks', async (req, res) => {
  try {
    const { jail_id, block_name, capacity } = req.body;
    const sql = `
      INSERT INTO cell_blocks (jail_id, block_name, capacity)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const { rows } = await pool.query(sql, [jail_id, block_name, capacity]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error creating cell block:', err);
    res.status(500).json({ error: 'Failed to create cell block' });
  }
});

// Create cell
router.post('/cells', async (req, res) => {
  try {
    const { block_id, cell_number, capacity, status } = req.body;
    const sql = `
      INSERT INTO cells (block_id, cell_number, capacity, status)
      VALUES ($1, $2, $3, COALESCE($4, 'available'))
      RETURNING *;
    `;
    const { rows } = await pool.query(sql, [block_id, cell_number, capacity, status]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error creating cell:', err);
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Cell number already exists in this block' });
    }
    res.status(500).json({ error: 'Failed to create cell' });
  }
});

// Update cell status
router.put('/cells/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, capacity } = req.body;
    const sql = `
      UPDATE cells 
      SET status = COALESCE($1, status),
          capacity = COALESCE($2, capacity)
      WHERE cell_id = $3
      RETURNING *;
    `;
    const { rows } = await pool.query(sql, [status, capacity, id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Cell not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Error updating cell:', err);
    res.status(500).json({ error: 'Failed to update cell' });
  }
});

export default router;
