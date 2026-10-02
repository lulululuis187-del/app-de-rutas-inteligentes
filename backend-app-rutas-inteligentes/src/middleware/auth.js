const jwt = require('jsonwebtoken');

function readToken(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  return header.slice(7);
}

function optionalAuth(req, _res, next) {
  const token = readToken(req);
  if (!token) return next();
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    req.user = null;
  }
  next();
}

function requireAuth(req, res, next) {
  const token = readToken(req);
  if (!token) {
    return res.status(401).json({ mensaje: 'Debes iniciar sesión.' });
  }
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ mensaje: 'La sesión no es válida o ya venció.' });
  }
}

function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user?.rol !== 'administrador') {
      return res.status(403).json({ mensaje: 'Esta acción solo está disponible para administradores.' });
    }
    return next();
  });
}

module.exports = { optionalAuth, requireAuth, requireAdmin };
