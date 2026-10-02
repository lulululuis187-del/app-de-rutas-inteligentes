const express = require('express');
const { pool } = require('../db');
const { optionalAuth, requireAuth } = require('../middleware/auth');

const router = express.Router();

function normalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function queryPlace(value) {
  const text = normalize(value);
  if (text.includes('ubicacion actual') || text === 'mi ubicacion') return 'plaza central';
  return text;
}

function toNumber(value) {
  if (value == null) return value;
  const number = Number(value);
  return Number.isNaN(number) ? value : number;
}

function mapRuta(row, extras = {}) {
  return {
    id_ruta: row.id_ruta,
    nombre: row.nombre,
    tiempo_estimado: row.tiempo_estimado,
    costo_aproximado: toNumber(row.costo_aproximado),
    transbordos: row.transbordos,
    distancia_caminar: row.distancia_caminar,
    resumen: row.resumen,
    horario: row.horario,
    estado_trafico: row.estado_trafico,
    etiqueta: row.etiqueta,
    origen: row.origen,
    destino: row.destino,
    transporte: {
      id_transporte: row.id_transporte,
      tipo: row.tipo,
      nombre: row.transporte_nombre,
      codigo: row.codigo,
    },
    ...extras,
  };
}

async function loadChildren(ids) {
  if (!ids.length) return { paradas: [], instrucciones: [] };
  const marks = ids.map(() => '?').join(',');
  const [paradas] = await pool.query(
    `SELECT * FROM paradas WHERE id_ruta IN (${marks}) ORDER BY orden ASC`,
    ids
  );
  const [instrucciones] = await pool.query(
    `SELECT * FROM instrucciones WHERE id_ruta IN (${marks}) ORDER BY orden ASC`,
    ids
  );
  return {
    paradas: paradas.map((p) => ({ ...p, latitud: toNumber(p.latitud), longitud: toNumber(p.longitud) })),
    instrucciones,
  };
}

function groupBy(rows, key) {
  return rows.reduce((acc, row) => {
    acc[row[key]] = acc[row[key]] || [];
    acc[row[key]].push(row);
    return acc;
  }, {});
}

function preferenceLabel(preferencia) {
  if (preferencia === 'costo') return 'MÁS ECONÓMICO';
  if (preferencia === 'transbordos') return 'MENOS TRANSBORDOS';
  return 'RECOMENDADA POR MENOR TIEMPO';
}

function sortRutas(rutas, preferencia) {
  const copy = [...rutas];
  copy.sort((a, b) => {
    if (preferencia === 'costo') return a.costo_aproximado - b.costo_aproximado;
    if (preferencia === 'transbordos') {
      return a.transbordos - b.transbordos || a.tiempo_estimado - b.tiempo_estimado;
    }
    return a.tiempo_estimado - b.tiempo_estimado;
  });
  return copy.map((ruta, index) => ({
    ...ruta,
    destacada: index === 0,
    etiqueta_activa: index === 0 ? preferenceLabel(preferencia) : ruta.etiqueta,
  }));
}

function matches(ruta, origen, destino) {
  const blob = normalize([
    ruta.origen,
    ruta.destino,
    ruta.nombre,
    ...(ruta.paradas || []).map((p) => p.nombre),
  ].join(' '));
  const originOk = !origen || blob.includes(origen) || origen.includes(normalize(ruta.origen));
  const destOk = !destino || blob.includes(destino) || destino.includes(normalize(ruta.destino));
  return originOk && destOk;
}

async function favoriteIds(userId) {
  if (!userId) return new Set();
  const [rows] = await pool.query(
    'SELECT id_ruta FROM rutas_favoritas WHERE id_usuario = ?',
    [userId]
  );
  return new Set(rows.map((row) => row.id_ruta));
}

async function hydrate(rows, userId) {
  const ids = rows.map((row) => row.id_ruta);
  const { paradas, instrucciones } = await loadChildren(ids);
  const paradasBy = groupBy(paradas, 'id_ruta');
  const pasosBy = groupBy(instrucciones, 'id_ruta');
  const favs = await favoriteIds(userId);
  return rows.map((row) => mapRuta(row, {
    paradas: paradasBy[row.id_ruta] || [],
    instrucciones: pasosBy[row.id_ruta] || [],
    es_favorita: favs.has(row.id_ruta),
  }));
}

router.get('/transportes', async (_req, res) => {
  const [rows] = await pool.query('SELECT * FROM transportes ORDER BY id_transporte');
  res.json({ transportes: rows });
});

router.get('/rutas', optionalAuth, async (req, res) => {
  const [rows] = await pool.query(
    `SELECT r.*, t.tipo, t.nombre AS transporte_nombre, t.codigo
     FROM rutas r
     LEFT JOIN transportes t ON t.id_transporte = r.id_transporte
     ORDER BY r.tiempo_estimado ASC`
  );
  let rutas = await hydrate(rows, req.user?.id_usuario);
  const origen = queryPlace(req.query.origen);
  const destino = queryPlace(req.query.destino);
  let coincidencia = 'catalogo';
  if (origen || destino) {
    const exactas = rutas.filter((ruta) => matches(ruta, origen, destino));
    if (exactas.length) {
      rutas = exactas;
      coincidencia = 'exacta';
    } else {
      coincidencia = 'sugerida';
    }
  }
  const preferencia = ['tiempo', 'costo', 'transbordos'].includes(req.query.preferencia)
    ? req.query.preferencia
    : 'tiempo';
  res.json({
    coincidencia,
    preferencia,
    rutas: sortRutas(rutas, preferencia),
  });
});

router.get('/rutas/:id', optionalAuth, async (req, res) => {
  const [rows] = await pool.query(
    `SELECT r.*, t.tipo, t.nombre AS transporte_nombre, t.codigo
     FROM rutas r
     LEFT JOIN transportes t ON t.id_transporte = r.id_transporte
     WHERE r.id_ruta = ?`,
    [req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ mensaje: 'No encontramos esa ruta.' });
  const [ruta] = await hydrate(rows, req.user?.id_usuario);
  res.json({ ruta });
});

router.get('/paradas/cercanas', async (req, res) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  const radio = Number(req.query.radio || 2500);
  const [rows] = await pool.query(
    `SELECT p.*, r.nombre AS ruta_nombre, t.tipo
     FROM paradas p
     INNER JOIN rutas r ON r.id_ruta = p.id_ruta
     LEFT JOIN transportes t ON t.id_transporte = r.id_transporte`
  );
  const withDistance = rows.map((row) => {
    const latitud = toNumber(row.latitud);
    const longitud = toNumber(row.longitud);
    const distancia = Number.isFinite(lat) && Number.isFinite(lng)
      ? haversine(lat, lng, latitud, longitud)
      : null;
    return { ...row, latitud, longitud, distancia_metros: distancia == null ? null : Math.round(distancia) };
  });
  const cercanas = Number.isFinite(lat) && Number.isFinite(lng)
    ? withDistance.filter((row) => row.distancia_metros <= radio).sort((a, b) => a.distancia_metros - b.distancia_metros)
    : withDistance.slice(0, 8);
  res.json({ paradas: cercanas.slice(0, 12) });
});

router.get('/alertas', async (_req, res) => {
  const [rows] = await pool.query(
    `SELECT a.*, r.nombre AS ruta_nombre
     FROM alertas a
     LEFT JOIN rutas r ON r.id_ruta = a.id_ruta
     WHERE a.activa = 1
     ORDER BY a.fecha DESC`
  );
  res.json({ alertas: rows });
});

router.get('/favoritos', requireAuth, async (req, res) => {
  const [rows] = await pool.query(
    `SELECT r.*, t.tipo, t.nombre AS transporte_nombre, t.codigo, f.alias, f.id_favorito
     FROM rutas_favoritas f
     INNER JOIN rutas r ON r.id_ruta = f.id_ruta
     LEFT JOIN transportes t ON t.id_transporte = r.id_transporte
     WHERE f.id_usuario = ?
     ORDER BY f.fecha_guardado DESC`,
    [req.user.id_usuario]
  );
  const rutas = await hydrate(rows, req.user.id_usuario);
  res.json({
    favoritos: rutas.map((ruta, index) => ({ ...ruta, alias: rows[index].alias, id_favorito: rows[index].id_favorito })),
  });
});

router.post('/favoritos', requireAuth, async (req, res) => {
  const idRuta = Number(req.body.id_ruta);
  const alias = String(req.body.alias || '').trim().slice(0, 80) || null;
  if (!idRuta) return res.status(400).json({ mensaje: 'Indica la ruta que quieres guardar.' });
  const [exists] = await pool.query('SELECT id_ruta FROM rutas WHERE id_ruta = ?', [idRuta]);
  if (!exists.length) return res.status(404).json({ mensaje: 'Esa ruta no existe.' });
  await pool.query(
    `INSERT INTO rutas_favoritas (id_usuario, id_ruta, alias) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE alias = COALESCE(VALUES(alias), alias)`,
    [req.user.id_usuario, idRuta, alias]
  );
  res.status(201).json({ mensaje: 'Ruta guardada en favoritos.' });
});

router.delete('/favoritos/:idRuta', requireAuth, async (req, res) => {
  await pool.query(
    'DELETE FROM rutas_favoritas WHERE id_usuario = ? AND id_ruta = ?',
    [req.user.id_usuario, req.params.idRuta]
  );
  res.json({ mensaje: 'Ruta quitada de favoritos.' });
});

router.get('/busquedas', requireAuth, async (req, res) => {
  const [rows] = await pool.query(
    `SELECT * FROM busquedas WHERE id_usuario = ? ORDER BY fecha_busqueda DESC LIMIT 8`,
    [req.user.id_usuario]
  );
  res.json({ busquedas: rows });
});

router.post('/busquedas', optionalAuth, async (req, res) => {
  const origen = String(req.body.origen || '').trim();
  const destino = String(req.body.destino || '').trim();
  if (!origen || !destino) {
    return res.status(400).json({ mensaje: 'Origen y destino son obligatorios.' });
  }
  const [result] = await pool.query(
    `INSERT INTO busquedas (id_usuario, origen, destino, fecha_viaje, hora_salida)
     VALUES (?, ?, ?, ?, ?)`,
    [req.user?.id_usuario || null, origen, destino, req.body.fecha_viaje || null, req.body.hora_salida || null]
  );
  res.status(201).json({ id_busqueda: result.insertId });
});

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

module.exports = router;
