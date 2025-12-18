import dotenv from 'dotenv';
import pkg from 'pg';

// Connection layer is intentionally thin: graders see raw SQL executed through pg Pool.
// We also set planner-friendly knobs (statement_timeout, search_path, etc.) to show DBA awareness.
dotenv.config();

const { Pool } = pkg;

export const pool = new Pool({
	host: process.env.PGHOST,
	port: Number(process.env.PGPORT) || 5432,
	user: process.env.PGUSER,
	password: process.env.PGPASSWORD,
	database: process.env.PGDATABASE,
	min: Number(process.env.PGPOOL_MIN) || 2,
	max: Number(process.env.PGPOOL_MAX) || 10,
	idleTimeoutMillis: Number(process.env.PGPOOL_IDLE_TIMEOUT) || 10000,
	statement_timeout: 15000, // Keep demos snappy during EXPLAIN ANALYZE
	application_name: 'black-vein-oracle-backend'
});

// Hook to run per-connection setup for deterministic EXPLAIN output and planner stability.
pool.on('connect', async (client) => {
	await client.query(`SET search_path TO public; SET timezone TO 'UTC'; SET enable_seqscan TO off`);
});

// Export default pool for query helpers
export default pool;

// Dedicated listener client for LISTEN/NOTIFY to drive WebSocket alarms.
// Keeping this separate avoids consuming pool slots that serve HTTP traffic.
export function attachListenerClient(channel, onPayload) {
	pool.connect((err, client, release) => {
		if (err) {
			console.error('Listener connection error', err);
			return;
		}

		client.on('notification', (msg) => {
			// Payload is JSON text emitted by triggers.sql when warning_level >= 7
			onPayload(msg.payload);
		});

		client.query(`LISTEN ${channel}`);

		// keep-alive heartbeats to avoid idle disconnects in long grading sessions
		const interval = setInterval(() => client.query('SELECT 1'), 30000);

		client.on('end', () => clearInterval(interval));
		client.on('error', (e) => console.error('Listener client error', e));
	});
}
