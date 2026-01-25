/**
 * ============================================================
 * DATABASE CONNECTION MODULE
 * Bangladesh Jail & Thana Management System
 * ============================================================
 * 
 * This module establishes and manages the PostgreSQL database
 * connection using the 'pg' package's connection pooling.
 * 
 * Key Features:
 * - Connection pooling for efficient resource usage
 * - Environment-based configuration for security
 * - Per-connection setup for consistent query behavior
 * - Separate listener client for real-time notifications
 * ============================================================
 */

import dotenv from 'dotenv';
import pkg from 'pg';

// Load environment variables from .env file
// This keeps sensitive credentials out of source code
dotenv.config();

// Destructure Pool class from pg package
const { Pool } = pkg;

/**
 * PostgreSQL Connection Pool
 * 
 * A connection pool maintains multiple database connections that
 * can be reused across requests. This is more efficient than
 * creating a new connection for each query.
 * 
 * Configuration options:
 * - host: Database server hostname (localhost for development)
 * - port: PostgreSQL port (default 5432)
 * - user: Database username
 * - password: Database password
 * - database: Database name to connect to
 * - min: Minimum connections to keep open
 * - max: Maximum connections allowed
 * - idleTimeoutMillis: Close idle connections after this time
 * - statement_timeout: Cancel queries running longer than this
 * - application_name: Identifier shown in pg_stat_activity
 */
export const pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    port: Number(process.env.PGPORT) || 5432,
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'admin123',
    database: process.env.PGDATABASE || 'black_vein_oracle',
    
    // Pool sizing
    min: Number(process.env.PGPOOL_MIN) || 2,   // Minimum 2 connections ready
    max: Number(process.env.PGPOOL_MAX) || 10,  // Maximum 10 concurrent connections
    
    // Timeouts
    idleTimeoutMillis: Number(process.env.PGPOOL_IDLE_TIMEOUT) || 10000,
    statement_timeout: 15000,  // 15 second query timeout
    
    // Application identifier for monitoring
    application_name: 'jail-thana-management-backend'
});

/**
 * Per-Connection Setup Hook
 * 
 * This event handler runs every time a new connection is
 * established from the pool. It configures the connection
 * with consistent settings.
 * 
 * Settings applied:
 * - search_path: Which schema to search first for tables
 * - timezone: UTC for consistent timestamp handling
 */
pool.on('connect', async (client) => {
    await client.query(`
        SET search_path TO public; 
        SET timezone TO 'Asia/Dhaka';
    `);
});

/**
 * Connection Error Handler
 * 
 * Handles unexpected errors on idle clients in the pool.
 * Logs the error for debugging purposes.
 */
pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client:', err.message);
});

// Export pool as default for query helpers
export default pool;

/**
 * Helper function to execute a query
 * 
 * Provides a simple interface for running SQL queries
 * with proper error handling.
 * 
 * @param {string} text - SQL query string
 * @param {Array} params - Query parameters (for prepared statements)
 * @returns {Promise<object>} Query result with rows
 * 
 * Example usage:
 *   const result = await query('SELECT * FROM criminals WHERE risk_level >= $1', [7]);
 *   console.log(result.rows);
 */
export async function query(text, params) {
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;
        
        // Log slow queries (> 100ms) for performance monitoring
        if (duration > 100) {
            console.log('Slow query:', { text, duration: `${duration}ms`, rows: result.rowCount });
        }
        
        return result;
    } catch (error) {
        console.error('Database query error:', {
            message: error.message,
            query: text.substring(0, 100) + '...'
        });
        throw error;
    }
}

/**
 * Get a client from the pool for transaction support
 * 
 * Use this when you need to run multiple queries in a
 * single transaction. Remember to release the client!
 * 
 * Example usage:
 *   const client = await getClient();
 *   try {
 *       await client.query('BEGIN');
 *       await client.query('INSERT INTO ...');
 *       await client.query('UPDATE ...');
 *       await client.query('COMMIT');
 *   } catch (e) {
 *       await client.query('ROLLBACK');
 *       throw e;
 *   } finally {
 *       client.release();
 *   }
 */
export async function getClient() {
    const client = await pool.connect();
    return client;
}

/**
 * Check database connection health
 * 
 * Simple health check for monitoring and startup verification.
 * 
 * @returns {Promise<boolean>} True if connection is healthy
 */
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
        return {
            healthy: false,
            error: error.message
        };
    }
}

/**
 * Attach PostgreSQL LISTEN/NOTIFY Client
 * 
 * Creates a dedicated connection for real-time notifications.
 * Used for alerting when incidents occur.
 * 
 * @param {string} channel - PostgreSQL channel name to listen on
 * @param {function} callback - Function to call when notification received
 */
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
                const payload = JSON.parse(msg.payload);
                callback(payload);
            } catch (e) {
                callback(msg.payload);
            }
        }
    });
    
    client.on('error', (e) => console.error('Listener client error:', e));
    
    console.log(`Listening on channel: ${channel}`);
    return client;
}
