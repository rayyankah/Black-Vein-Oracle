import pool from '../database/connection.js';
import explain from '../utils/query_explainer.js';

// Timeline analysis with window functions and temporal slicing.
// Powers the HQ timeline slider: computes moving averages of warning levels per criminal over time.

export async function getIncidentVelocity(criminalId, days = 90) {
  const sql = `
    WITH filtered AS (
      SELECT i.incident_id, i.occurred_at, i.warning_level
      FROM incident_participants ip
      JOIN incidents i ON i.incident_id = ip.incident_id
      WHERE ip.criminal_id = $1
        AND i.occurred_at >= NOW() - ($2 || ' days')::INTERVAL
    )
    SELECT
      date_trunc('day', occurred_at) AS day,
      COUNT(*) AS incidents_per_day,
      AVG(warning_level) OVER (ORDER BY date_trunc('day', occurred_at) ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) AS moving_avg_warning,
      SUM(warning_level) OVER (ORDER BY date_trunc('day', occurred_at) ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) AS cumulative_warning
    FROM filtered
    GROUP BY day
    ORDER BY day;
  `;

  await explain(sql, [criminalId, days], 'timeline_analysis');
  const { rows } = await pool.query(sql, [criminalId, days]);
  return rows;
}

export default { getIncidentVelocity };
