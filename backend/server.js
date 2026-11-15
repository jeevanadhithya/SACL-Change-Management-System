require('dotenv').config();
const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/apiRoutes');
const { getPool } = require('./config/db');

const PORT = Number(process.env.PORT) || 5000;
const app = express();

app.use(cors());
app.use(express.json({ limit: '5mb' }));

app.use('/api', apiRoutes);

app.get('/', (_req, res) => {
  res.json({
    service: 'Sakthi Auto Component Limited - 4M Change Management MSSQL API',
    status: 'running',
  });
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
