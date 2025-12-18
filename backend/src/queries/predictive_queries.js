import pool from '../database/connection.js';
import explain from '../utils/query_explainer.js';

// SQL-only predictive heuristics: pattern detection via window functions and FTS.
// Identifies at-risk victims by correlating communication bursts, high warning incidents, and proximity.

export async function detectAtRiskVictims(limit = 20) {
  const sql = `
    WITH comms AS (
      SELECT receiver AS criminal_id, COUNT(*) AS recent_msgs
      FROM communications
      WHERE sent_at >= NOW() - INTERVAL '30 days'
      GROUP BY receiver
    ),
    hot_incidents AS (
      SELECT ip.criminal_id, COUNT(*) AS high_warn_events
      FROM incident_participants ip
      JOIN incidents i ON i.incident_id = ip.incident_id
      WHERE i.warning_level >= 7 AND i.occurred_at >= NOW() - INTERVAL '60 days'
      GROUP BY ip.criminal_id
    ),
    scored AS (
      SELECT
        v.victim_id,
        v.name,
        COALESCE(h.high_warn_events,0) * 2 + COALESCE(c.recent_msgs,0) AS risk_signal,
        v.risk_band,
        v.protected,
        v.last_seen_incident
      FROM victims v
      LEFT JOIN hot_incidents h ON h.criminal_id = v.last_seen_incident
      LEFT JOIN comms c ON c.criminal_id = v.last_seen_incident
    )
    SELECT *
    FROM scored
    ORDER BY risk_signal DESC
    LIMIT $1;
  `;
  await explain(sql, [limit], 'predictive_queries');
  const { rows } = await pool.query(sql, [limit]);
  return rows;
}

// FTS-driven suspect search blending names + dossier content
export async function searchCriminals(query, limit = 15) {
  const sql = `
    SELECT criminal_id, primary_name, nationality, similarity(primary_name, $1) AS name_sim
    FROM criminals
    WHERE search_vector @@ websearch_to_tsquery('english', $1)
    ORDER BY name_sim DESC
    LIMIT $2;
  `;
  await explain(sql, [query, limit], 'predictive_queries_search');
  const { rows } = await pool.query(sql, [query, limit]);
  return rows;
}

export default { detectAtRiskVictims, searchCriminals };
