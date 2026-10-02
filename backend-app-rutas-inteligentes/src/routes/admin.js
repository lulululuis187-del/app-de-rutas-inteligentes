const express = require('express');
const { pool } = require('../db');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(requireAdmin);

router.get('/usuarios', async (_req, res) => {
  const [rows] = await pool.query(
    'SELECT id_usuario, nombre, correo, rol, fecha_registro FROM usuarios ORDER BY fecha_registro DESC'
  );
  res.json({ usuarios: rows });
});

router.patch('/usuarios/:id', async (req, res) => {
  const rol = req.body.rol;
  if (!['usuario', 'administrador'].includes(rol)) {
    return res.status(400).json({ mensaje: 'El rol debe ser usuario o administrador.' });
  }
  if (Number(req.params.id) === req.user.id_usuario && rol !== 'administrador') {
    return res.status(400).json({ mensaje: 'No puedes quitarte el rol de administrador.' });
  }
  const [result] = await pool.query('UPDATE usuarios SET rol = ? WHERE id_usuario = ?', [rol, req.params.id]);
  if (!result.affectedRows) return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
  res.json({ mensaje: 'Rol actualizado.' });
});

router.delete('/usuarios/:id', async (req, res) => {
  if (Number(req.params.id) === req.user.id_usuario) {
    return res.status(400).json({ mensaje: 'No puedes eliminar tu propia cuenta.' });
  }
  const [result] = await pool.query('DELETE FROM usuarios WHERE id_usuario = ?', [req.params.id]);
  if (!result.affectedRows) return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
  res.json({ mensaje: 'Usuario eliminado.' });
});

router.post('/transportes', async (req, res) => {
  const tipo = String(req.body.tipo || '').trim();
  const nombre = String(req.body.nombre || '').trim();
  const codigo = String(req.body.codigo || '').trim() || null;
  if (!tipo || !nombre) return res.status(400).json({ mensaje: 'Tipo y nombre son obligatorios.' });
  const [result] = await pool.query(
    'INSERT INTO transportes (tipo, nombre, codigo) VALUES (?, ?, ?)',
    [tipo, nombre, codigo]
  );
  res.status(201).json({ id_transporte: result.insertId });
});

router.put('/transportes/:id', async (req, res) => {
  const [result] = await pool.query(
    'UPDATE transportes SET tipo = ?, nombre = ?, codigo = ? WHERE id_transporte = ?',
    [req.body.tipo, req.body.nombre, req.body.codigo || null, req.params.id]
  );
  if (!result.affectedRows) return res.status(404).json({ mensaje: 'Transporte no encontrado.' });
  res.json({ mensaje: 'Transporte actualizado.' });
});

router.delete('/transportes/:id', async (req, res) => {
  const [used] = await pool.query('SELECT id_ruta FROM rutas WHERE id_transporte = ? LIMIT 1', [req.params.id]);
  if (used.length) {
    return res.status(409).json({ mensaje: 'Hay rutas usando este transporte. Cámbialas antes de eliminarlo.' });
  }
  await pool.query('DELETE FROM transportes WHERE id_transporte = ?', [req.params.id]);
  res.json({ mensaje: 'Transporte eliminado.' });
});

router.post('/rutas', async (req, res) => {
  const nombre = String(req.body.nombre || '').trim();
  if (!nombre) return res.status(400).json({ mensaje: 'La ruta necesita un nombre.' });
  const [result] = await pool.query(
    `INSERT INTO rutas
      (nombre, tiempo_estimado, costo_aproximado, transbordos, id_transporte, origen, destino, distancia_caminar, resumen, horario, estado_trafico, etiqueta)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      nombre,
      Number(req.body.tiempo_estimado || 0),
      Number(req.body.costo_aproximado || 0),
      Number(req.body.transbordos || 0),
      req.body.id_transporte || null,
      req.body.origen || null,
      req.body.destino || null,
      Number(req.body.distancia_caminar || 0),
      req.body.resumen || null,
      req.body.horario || null,
      req.body.estado_trafico || 'Servicio normal',
      req.body.etiqueta || null,
    ]
  );
  res.status(201).json({ id_ruta: result.insertId });
});

router.put('/rutas/:id', async (req, res) => {
  const [result] = await pool.query(
    `UPDATE rutas SET
      nombre = ?, tiempo_estimado = ?, costo_aproximado = ?, transbordos = ?, id_transporte = ?,
      origen = ?, destino = ?, distancia_caminar = ?, resumen = ?, horario = ?, estado_trafico = ?, etiqueta = ?
     WHERE id_ruta = ?`,
    [
      req.body.nombre,
      Number(req.body.tiempo_estimado || 0),
      Number(req.body.costo_aproximado || 0),
      Number(req.body.transbordos || 0),
      req.body.id_transporte || null,
      req.body.origen || null,
      req.body.destino || null,
      Number(req.body.distancia_caminar || 0),
      req.body.resumen || null,
      req.body.horario || null,
      req.body.estado_trafico || null,
      req.body.etiqueta || null,
      req.params.id,
    ]
  );
  if (!result.affectedRows) return res.status(404).json({ mensaje: 'Ruta no encontrada.' });
  res.json({ mensaje: 'Ruta actualizada.' });
});

router.delete('/rutas/:id', async (req, res) => {
  const [result] = await pool.query('DELETE FROM rutas WHERE id_ruta = ?', [req.params.id]);
  if (!result.affectedRows) return res.status(404).json({ mensaje: 'Ruta no encontrada.' });
  res.json({ mensaje: 'Ruta eliminada.' });
});

router.post('/paradas', async (req, res) => {
  const nombre = String(req.body.nombre || '').trim();
  if (!req.body.id_ruta || !nombre) {
    return res.status(400).json({ mensaje: 'La parada necesita ruta y nombre.' });
  }
  const [result] = await pool.query(
    'INSERT INTO paradas (id_ruta, nombre, latitud, longitud, orden) VALUES (?, ?, ?, ?, ?)',
    [req.body.id_ruta, nombre, req.body.latitud || null, req.body.longitud || null, Number(req.body.orden || 0)]
  );
  res.status(201).json({ id_parada: result.insertId });
});

router.put('/paradas/:id', async (req, res) => {
  const [result] = await pool.query(
    'UPDATE paradas SET id_ruta = ?, nombre = ?, latitud = ?, longitud = ?, orden = ? WHERE id_parada = ?',
    [req.body.id_ruta, req.body.nombre, req.body.latitud, req.body.longitud, req.body.orden || 0, req.params.id]
  );
  if (!result.affectedRows) return res.status(404).json({ mensaje: 'Parada no encontrada.' });
  res.json({ mensaje: 'Parada actualizada.' });
});

router.delete('/paradas/:id', async (req, res) => {
  await pool.query('DELETE FROM paradas WHERE id_parada = ?', [req.params.id]);
  res.json({ mensaje: 'Parada eliminada.' });
});

router.post('/instrucciones', async (req, res) => {
  const titulo = String(req.body.titulo || '').trim();
  if (!req.body.id_ruta || !titulo) {
    return res.status(400).json({ mensaje: 'La instrucción necesita ruta y título.' });
  }
  const tipo = ['caminar', 'bus', 'metro', 'transbordo', 'llegada'].includes(req.body.tipo)
    ? req.body.tipo
    : 'bus';
  const [result] = await pool.query(
    'INSERT INTO instrucciones (id_ruta, orden, titulo, detalle, tipo) VALUES (?, ?, ?, ?, ?)',
    [req.body.id_ruta, Number(req.body.orden || 1), titulo, req.body.detalle || null, tipo]
  );
  res.status(201).json({ id_instruccion: result.insertId });
});

router.delete('/instrucciones/:id', async (req, res) => {
  await pool.query('DELETE FROM instrucciones WHERE id_instruccion = ?', [req.params.id]);
  res.json({ mensaje: 'Instrucción eliminada.' });
});

router.post('/alertas', async (req, res) => {
  const titulo = String(req.body.titulo || '').trim();
  const mensaje = String(req.body.mensaje || '').trim();
  if (!titulo || !mensaje) return res.status(400).json({ mensaje: 'Título y mensaje son obligatorios.' });
  const severidad = ['info', 'advertencia', 'critica'].includes(req.body.severidad) ? req.body.severidad : 'info';
  const [result] = await pool.query(
    'INSERT INTO alertas (id_ruta, titulo, mensaje, severidad, activa) VALUES (?, ?, ?, ?, 1)',
    [req.body.id_ruta || null, titulo, mensaje, severidad]
  );
  res.status(201).json({ id_alerta: result.insertId });
});

router.patch('/alertas/:id', async (req, res) => {
  const [result] = await pool.query('UPDATE alertas SET activa = ? WHERE id_alerta = ?', [
    req.body.activa ? 1 : 0,
    req.params.id,
  ]);
  if (!result.affectedRows) return res.status(404).json({ mensaje: 'Alerta no encontrada.' });
  res.json({ mensaje: 'Alerta actualizada.' });
});

router.delete('/alertas/:id', async (req, res) => {
  await pool.query('DELETE FROM alertas WHERE id_alerta = ?', [req.params.id]);
  res.json({ mensaje: 'Alerta eliminada.' });
});

module.exports = router;
