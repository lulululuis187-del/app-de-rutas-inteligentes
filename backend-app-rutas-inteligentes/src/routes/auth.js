const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function tokenFor(user) {
  return jwt.sign(
    {
      id_usuario: user.id_usuario,
      nombre: user.nombre,
      correo: user.correo,
      rol: user.rol,
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function publicUser(user) {
  return {
    id_usuario: user.id_usuario,
    nombre: user.nombre,
    correo: user.correo,
    rol: user.rol,
    etiqueta: user.rol === 'administrador' ? 'Administrador' : 'Pasajero Frecuente',
  };
}

router.post('/registro', async (req, res) => {
  const nombre = String(req.body.nombre || '').trim();
  const correo = String(req.body.correo || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  if (nombre.length < 2) return res.status(400).json({ mensaje: 'Escribe tu nombre.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    return res.status(400).json({ mensaje: 'El correo no es válido.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ mensaje: 'La contraseña debe tener al menos 6 caracteres.' });
  }

  const [exists] = await pool.query('SELECT id_usuario FROM usuarios WHERE correo = ?', [correo]);
  if (exists.length) return res.status(409).json({ mensaje: 'Ese correo ya está registrado.' });

  const hash = await bcrypt.hash(password, 10);
  const [result] = await pool.query(
    `INSERT INTO usuarios (nombre, correo, password, rol) VALUES (?, ?, ?, 'usuario')`,
    [nombre, correo, hash]
  );
  const user = { id_usuario: result.insertId, nombre, correo, rol: 'usuario' };
  res.status(201).json({ token: tokenFor(user), usuario: publicUser(user) });
});

router.post('/login', async (req, res) => {
  const correo = String(req.body.correo || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const [rows] = await pool.query('SELECT * FROM usuarios WHERE correo = ?', [correo]);
  const user = rows[0];
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ mensaje: 'Correo o contraseña incorrectos.' });
  }
  res.json({ token: tokenFor(user), usuario: publicUser(user) });
});

router.get('/me', requireAuth, async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id_usuario, nombre, correo, rol FROM usuarios WHERE id_usuario = ?',
    [req.user.id_usuario]
  );
  if (!rows[0]) return res.status(401).json({ mensaje: 'El usuario ya no existe.' });
  res.json({ usuario: publicUser(rows[0]) });
});

module.exports = router;
