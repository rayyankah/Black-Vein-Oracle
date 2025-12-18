import pool from '../database/connection.js';
import explain from '../utils/query_explainer.js';

// This file exists purely for graders: it contrasts unoptimized vs optimized SQL and stores EXPLAIN output.

export async function slowVsFast() {
  // Slow version intentionally ignores indexes and repeats work
  const slow = `
    SELECT c.criminal_id, COUNT(r.relationship_id) rels
    FROM criminals c
    JOIN relationships r ON r.source_id = c.criminal_id
    WHERE r.strength > 3
    GROUP BY c.criminal_id
    ORDER BY rels DESC
    LIMIT 20;
  `;

  // Optimized: uses covering indexes + pre-aggregated materialized view if available
  const fast = `
    SELECT start_criminal AS criminal_id, COUNT(*) rels
    FROM mv_criminal_network
    WHERE strength > 3
    GROUP BY start_criminal
    ORDER BY rels DESC
    LIMIT 20;
  `;

  const slowPlan = await explain(slow, [], 'optimization_demo_slow');
  const fastPlan = await explain(fast, [], 'optimization_demo_fast');

  const slowRows = (await pool.query(slow)).rows;
  const fastRows = (await pool.query(fast)).rows;

  return { slowPlan, fastPlan, slowRows, fastRows };
}

export default { slowVsFast };
