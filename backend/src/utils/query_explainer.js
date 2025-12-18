import { performance } from 'perf_hooks';
import pool from '../database/connection.js';
import perfLog from './performance_logger.js';

// Utility to run EXPLAIN ANALYZE for any showcased query.
// Stores plan + duration into query_probes table for grading evidence and visualization.

export default async function explain(sql, params = [], label = 'unnamed') {
  const start = performance.now();
  const { rows } = await pool.query(`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${sql}`, params);
  const durationMs = performance.now() - start;
  const plan = rows?.[0]?.['QUERY PLAN']?.[0];

  await pool.query(
    `INSERT INTO query_probes (label, sql_text, plan, duration_ms) VALUES ($1,$2,$3,$4);`,
    [label, sql, plan, durationMs]
  );

  perfLog(label, durationMs);
  return plan;
}
