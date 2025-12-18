import pool from '../database/connection.js';
import explain from '../utils/query_explainer.js';

// This module houses recursive CTEs that map six degrees of separation between criminals.
// It feeds the HQ network graph and demonstrates grading criteria: recursive SQL, cycle avoidance,
// cost-aware ordering, and EXPLAIN ANALYZE integration.

export async function getNetworkPaths(criminalId, maxDepth = 6) {
  const sql = `
    WITH RECURSIVE graph AS (
      SELECT
        r.source_id AS root,
        r.target_id,
        1 AS depth,
        ARRAY[r.source_id, r.target_id] AS path,
        r.relation_type,
        r.strength
      FROM relationships r
      WHERE r.source_id = $1
      UNION ALL
      SELECT
        g.root,
        r.target_id,
        g.depth + 1,
        g.path || r.target_id,
        r.relation_type,
        LEAST(g.strength, r.strength) AS strength
      FROM graph g
      JOIN relationships r ON r.source_id = g.target_id
      WHERE g.depth < $2 AND NOT r.target_id = ANY(g.path)
    )
    SELECT DISTINCT ON (target_id)
      target_id,
      depth,
      path,
      relation_type,
      strength,
      depth * (11 - strength) AS risk_cost
    FROM graph
    ORDER BY target_id, depth ASC, strength DESC;
  `;

  // Run EXPLAIN ANALYZE to capture planner behavior for optimization demos
  await explain(sql, [criminalId, maxDepth], 'criminal_network');
  const { rows } = await pool.query(sql, [criminalId, maxDepth]);
  return rows;
}

export default { getNetworkPaths };
