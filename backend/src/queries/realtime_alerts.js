import pool from '../database/connection.js';
import explain from '../utils/query_explainer.js';

// Real-time alerts: SQL that mirrors trigger behavior so HQ can backfill or poll
// when WebSockets are unavailable. Focuses on NOTIFY-powered channel alignment.

export async function fetchOpenAlerts(limit = 20) {
  const sql = `
    SELECT alert_id, incident_id, payload, triggered_at
    FROM alerts
    WHERE handled = FALSE
    ORDER BY triggered_at DESC
    LIMIT $1;
  `;
  await explain(sql, [limit], 'realtime_alerts');
  const { rows } = await pool.query(sql, [limit]);
  return rows;
}

export async function markAlertHandled(alertId) {
  const sql = `UPDATE alerts SET handled = TRUE WHERE alert_id = $1 RETURNING *;`;
  await explain(sql, [alertId], 'realtime_alerts_mark');
  const { rows } = await pool.query(sql, [alertId]);
  return rows[0];
}

export default { fetchOpenAlerts, markAlertHandled };
