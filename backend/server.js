require('dotenv').config();
const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/apiRoutes');
const { getPool } = require('./config/db');

const PORT = Number(process.env.PORT) || 5000;
const app = express();

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean)
  : [];

app.use(
  cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'x-user-role'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  }),
);
app.use(express.json({ limit: '5mb' }));

app.use('/api', apiRoutes);

app.get('/', (_req, res) => {
  res.json({
    service: 'Sakthi Auto Component Limited - 4M Change Management MSSQL API',
    status: 'running',
  });
});

app.get('/health', async (_req, res) => {
  try {
    const pool = await getPool();
    await pool.request().query('SELECT 1 AS ok');
    res.json({ ok: true, db: 'connected' });
  } catch (err) {
    res.status(503).json({ ok: false, error: err.message });
  }
});

async function bootstrap() {
  try {
    await getPool();
  } catch (err) {
    console.warn('MSSQL connection check on startup failed (verify .env & SQL Server):', err.message);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SACL 4M Backend listening on http://localhost:${PORT}`);
  });
}

bootstrap();
