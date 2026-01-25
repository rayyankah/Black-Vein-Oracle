import http from 'http';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { WebSocketServer } from 'ws';
import pool, { attachListenerClient } from './database/connection.js';

// Route imports - aligned with jail management schema
import criminalRoutes from './routes/criminals.js';
import thanasRoutes from './routes/thanas.js';
import officersRoutes from './routes/officers.js';
import jailsRoutes from './routes/jails.js';
import arrestsRoutes from './routes/arrests.js';
import casesRoutes from './routes/cases.js';
import gdReportsRoutes from './routes/gdReports.js';
import incarcerationsRoutes from './routes/incarcerations.js';
import bailRecordsRoutes from './routes/bailRecords.js';
import analyticsRoutes from './routes/analytics.js';
import organizationsRoutes from './routes/organizations.js';
import usersRoutes from './routes/users.js';
import criminalLocationsRoutes from './routes/criminalLocations.js';
import createAlarmSocket from './sockets/alarm.js';

dotenv.config();

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

// API Routes
app.use('/api/criminals', criminalRoutes);
app.use('/api/thanas', thanasRoutes);
app.use('/api/officers', officersRoutes);
app.use('/api/jails', jailsRoutes);
app.use('/api/arrests', arrestsRoutes);
app.use('/api/cases', casesRoutes);
app.use('/api/gd-reports', gdReportsRoutes);
app.use('/api/incarcerations', incarcerationsRoutes);
app.use('/api/bail-records', bailRecordsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/organizations', organizationsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/criminal-locations', criminalLocationsRoutes);

// Health check endpoint
app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', database: 'disconnected' });
  }
});

// Dashboard stats endpoint
app.get('/api/dashboard/stats', async (_req, res) => {
  try {
    const sql = `
      SELECT 
        (SELECT COUNT(*) FROM criminals) AS total_criminals,
        (SELECT COUNT(*) FROM criminals WHERE status = 'in_custody') AS in_custody,
        (SELECT COUNT(*) FROM jails) AS total_jails,
        (SELECT COUNT(*) FROM thanas) AS total_thanas,
        (SELECT COUNT(*) FROM arrest_records) AS total_arrests,
        (SELECT COUNT(*) FROM case_files WHERE status = 'open') AS open_cases,
        (SELECT COUNT(*) FROM gd_reports WHERE status = 'pending') AS pending_gd_reports;
    `;
    const { rows } = await pool.query(sql);
    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// HTTP + WebSocket server
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// PostgreSQL LISTEN/NOTIFY for real-time alerts
attachListenerClient(process.env.ALERT_CHANNEL || 'incident_alerts', (payload) => {
  createAlarmSocket.broadcast(wss, payload);
}).catch((err) => {
  console.error('Failed to attach listener client:', err.message);
  // Server continues without real-time notifications
});

// Initialize socket behavior (heartbeats, client registry, etc.).
createAlarmSocket.init(wss);

const port = pWebSocket
server.listen(port, () => {
  console.log(`Jail Management System backend listening on port ${port}`);
});

// Graceful shutdown to avoid leaking connections
process.on('SIGINT', async () => {
  await pool.end();
  process.exit(0);
});
