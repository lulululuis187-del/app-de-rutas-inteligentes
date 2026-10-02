const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./db');
const authRoutes = require('./routes/auth');
const catalogoRoutes = require('./routes/catalogo');
const adminRoutes = require('./routes/admin');

const app = express();

app.use(cors());
app.use(express.json());

app.use(async (_req, _res, next) => {
  try {
    await initDatabase();
    next();
  } catch (error) {
    next(error);
  }
});

app.get(['/', '/api'], (_req, res) => {
  res.json({
    ok: true,
    servicio: 'ruta-facil',
    mensaje: 'API de RutaLocal. Esta URL es el backend, no la PWA.',
    salud: '/api/health',
    rutas: '/api/rutas',
    auth: '/api/auth/login',
  });
});

app.get('/api/health', async (_req, res) => {
  res.json({ ok: true, servicio: 'ruta-facil' });
});

app.use('/api/auth', authRoutes);
app.use('/api', catalogoRoutes);
app.use('/api/admin', adminRoutes);

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ mensaje: 'No pudimos completar la solicitud. Inténtalo de nuevo.' });
});

module.exports = app;
