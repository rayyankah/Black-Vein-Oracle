import { Router } from 'express';
import pool from '../database/connection.js';
import { getTimings } from '../utils/performance_logger.js';

// Analytics endpoints for jail management system

const router = Router();

// Get query performance logs
router.get('/performance', (_req, res) => {
  res.json(getTimings());
});

// Thana case summary - demonstrates GROUP BY, aggregation, and joins
router.get('/thana-summary', async (_req, res) => {
  try {
    const sql = `
      SELECT 
        t.thana_id,
        t.name AS thana_name,
        t.district,
        COUNT(DISTINCT cf.case_id) AS total_cases,
        COUNT(DISTINCT cf.case_id) FILTER (WHERE cf.status = 'open') AS open_cases,
        COUNT(DISTINCT cf.case_id) FILTER (WHERE cf.status = 'closed') AS closed_cases,
        COUNT(DISTINCT ar.arrest_id) AS total_arrests,
        COUNT(DISTINCT o.officer_id) AS officer_count,
        COUNT(DISTINCT gd.report_id) AS gd_reports
      FROM thanas t
      LEFT JOIN case_files cf ON cf.thana_id = t.thana_id
      LEFT JOIN arrest_records ar ON ar.thana_id = t.thana_id
      LEFT JOIN officers o ON o.thana_id = t.thana_id
      LEFT JOIN gd_reports gd ON gd.thana_id = t.thana_id
      GROUP BY t.thana_id, t.name, t.district
      ORDER BY total_cases DESC;
    `;
    const { rows } = await pool.query(sql);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching thana summary:', err);
    res.status(500).json({ error: 'Failed to fetch thana summary' });
  }
});

// Jail occupancy analytics - demonstrates window functions
router.get('/jail-occupancy', async (_req, res) => {
  try {
    const sql = `
      SELECT 
        j.jail_id,
        j.name AS jail_name,
        j.total_capacity,
        COUNT(i.incarceration_id) AS current_inmates,
        ROUND(COUNT(i.incarceration_id) * 100.0 / NULLIF(j.total_capacity, 0), 1) AS occupancy_percent,
        COUNT(DISTINCT cb.block_id) AS block_count,
        COUNT(DISTINCT c.cell_id) AS cell_count
      FROM jails j
      LEFT JOIN cell_blocks cb ON cb.jail_id = j.jail_id
      LEFT JOIN cells c ON c.block_id = cb.block_id
      LEFT JOIN incarcerations i ON i.cell_id = c.cell_id AND i.release_date IS NULL
      GROUP BY j.jail_id, j.name, j.total_capacity
      ORDER BY occupancy_percent DESC NULLS LAST;
    `;
    const { rows } = await pool.query(sql);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching jail occupancy:', err);
    res.status(500).json({ error: 'Failed to fetch jail occupancy' });
  }
});

// Criminal risk distribution - demonstrates GROUP BY with FILTER
router.get('/risk-distribution', async (_req, res) => {
  try {
    const sql = `
      SELECT 
        risk_level,
        COUNT(*) AS count,
        COUNT(*) FILTER (WHERE status = 'in_custody') AS in_custody,
        COUNT(*) FILTER (WHERE status = 'on_bail') AS on_bail,
        COUNT(*) FILTER (WHERE status = 'released') AS released,
        COUNT(*) FILTER (WHERE status = 'escaped') AS escaped
      FROM criminals
      GROUP BY risk_level
      ORDER BY risk_level DESC;
    `;
    const { rows } = await pool.query(sql);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching risk distribution:', err);
    res.status(500).json({ error: 'Failed to fetch risk distribution' });
  }
});

// Monthly arrest trends - demonstrates date functions and aggregation
router.get('/arrest-trends', async (_req, res) => {
  try {
    const sql = `
      SELECT 
        DATE_TRUNC('month', arrest_date)::date AS month,
        COUNT(*) AS arrests,
        COUNT(*) FILTER (WHERE status = 'detained') AS detained,
        COUNT(*) FILTER (WHERE status = 'released') AS released,
        COUNT(*) FILTER (WHERE status = 'transferred') AS transferred
      FROM arrest_records
      WHERE arrest_date >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', arrest_date)
      ORDER BY month;
    `;
    const { rows } = await pool.query(sql);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching arrest trends:', err);
    res.status(500).json({ error: 'Failed to fetch arrest trends' });
  }
});

// Officer workload - demonstrates complex joins and aggregation
router.get('/officer-workload', async (_req, res) => {
  try {
    const sql = `
      SELECT 
        o.officer_id,
        o.full_name,
        r.rank_name,
        t.name AS thana_name,
        COUNT(DISTINCT ar.arrest_id) AS arrests_made,
        COUNT(DISTINCT cf.case_id) AS cases_assigned
      FROM officers o
      LEFT JOIN ranks r ON r.rank_id = o.rank_id
      LEFT JOIN thanas t ON t.thana_id = o.thana_id
      LEFT JOIN arrest_records ar ON ar.arresting_officer_id = o.officer_id
      LEFT JOIN case_files cf ON cf.assigned_officer_id = o.officer_id
      GROUP BY o.officer_id, o.full_name, r.rank_name, t.name
      ORDER BY arrests_made DESC, cases_assigned DESC
      LIMIT 20;
    `;
    const { rows } = await pool.query(sql);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching officer workload:', err);
    res.status(500).json({ error: 'Failed to fetch officer workload' });
  }
});

// Database statistics - demonstrates system catalog queries
router.get('/database-stats', async (_req, res) => {
  try {
    const tableStats = await pool.query(`
      SELECT 
        relname AS table_name,
        n_live_tup AS row_count,
        n_dead_tup AS dead_rows
      FROM pg_stat_user_tables
      ORDER BY n_live_tup DESC;
    `);
    
    const indexStats = await pool.query(`
      SELECT 
        indexrelname AS index_name,
        idx_scan AS times_used,
        idx_tup_read AS rows_read
      FROM pg_stat_user_indexes
      ORDER BY idx_scan DESC
      LIMIT 10;
    `);
    
    res.json({
      tables: tableStats.rows,
      indexes: indexStats.rows
    });
  } catch (err) {
    console.error('Error fetching database stats:', err);
    res.status(500).json({ error: 'Failed to fetch database stats' });
  }
});

export default router;
