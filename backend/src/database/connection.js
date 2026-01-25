// Database Connection Module - PostgreSQL with Connection Pooling

import dotenv from 'dotenv';
import pkg from 'pg';

dotenv.config();
const { Pool } = pkg;

// Connection Pool Configuration
export const pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    port: Number(process.env.PGPORT) || 5432,
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'admin123',
    database: process.env.PGDATABASE || 'black_vein_oracle',
    min: Number(process.env.PGPOOL_MIN) || 2,
    max: Number(process.env.PGPOOL_MAX) || 10,
    idleTimeoutMillis: Number(process.env.PGPOOL_IDLE_TIMEOUT) || 10000,
    statement_timeout: 15000,
    application_name: 'jail-thana-management-backend'
});

// Set search path and timezone on each new connection
pool.on('connect', async (client) => {
    await client.query(`
        SET search_path TO public; 
        SET timezone TO 'Asia/Dhaka';
    `);
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client:', err.message);
});

export default pool;

// Execute a query with optional parameters
export async function query(text, params) {
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;
        if (duration > 100) {
            console.log('Slow query:', { text, duration: `${duration}ms`, rows: result.rowCount });
        }
        return result;
    } catch (error) {
        console.error('Database query error:', { message: error.message, query: text.substring(0, 100) });
        throw error;
    }
}

// Get a client for transaction support
export async function getClient() {
    return await pool.connect();
}

// Health check
export async function checkHealth() {
    try {
        const result = await pool.query('SELECT NOW() as current_time');
        return {
            healthy: true,
            timestamp: result.rows[0].current_time,
            poolSize: pool.totalCount,
            idleCount: pool.idleCount,
            waitingCount: pool.waitingCount
        };
    } catch (error) {
        return { healthy: false, error: error.message };
    }
}

// LISTEN/NOTIFY client for real-time alerts
export async function attachListenerClient(channel, callback) {
    const { Client } = pkg;
    const client = new Client({
        host: process.env.PGHOST || 'localhost',
        port: Number(process.env.PGPORT) || 5432,
        user: process.env.PGUSER || 'postgres',
        password: process.env.PGPASSWORD || 'admin123',
        database: process.env.PGDATABASE || 'black_vein_oracle'
    });
    
    await client.connect();
    await client.query(`LISTEN ${channel}`);
    
    client.on('notification', (msg) => {
        if (msg.channel === channel && callback) {
            try {
                callback(JSON.parse(msg.payload));
            } catch (e) {
                callback(msg.payload);
            }
        }
    });
    
    client.on('error', (e) => console.error('Listener client error:', e));
    console.log(`Listening on channel: ${channel}`);
    return client;
}
