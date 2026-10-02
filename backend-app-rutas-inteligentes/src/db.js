require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const pool = mysql.createPool({
  host: process.env.MYSQL_ADDON_HOST,
  user: process.env.MYSQL_ADDON_USER,
  password: process.env.MYSQL_ADDON_PASSWORD,
  database: process.env.MYSQL_ADDON_DB,
  port: Number(process.env.MYSQL_ADDON_PORT || 3306),
  waitForConnections: true,
  connectionLimit: 4,
  charset: 'utf8mb4',
  ssl: { rejectUnauthorized: false },
});

const TABLES = [
  `CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    rol ENUM('usuario', 'administrador') DEFAULT 'usuario',
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS transportes (
    id_transporte INT AUTO_INCREMENT PRIMARY KEY,
    tipo VARCHAR(50) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    codigo VARCHAR(50)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS rutas (
    id_ruta INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    tiempo_estimado INT,
    costo_aproximado DECIMAL(10,2),
    transbordos INT DEFAULT 0,
    id_transporte INT,
    origen VARCHAR(200),
    destino VARCHAR(200),
    distancia_caminar INT DEFAULT 0,
    resumen VARCHAR(400),
    horario VARCHAR(120),
    estado_trafico VARCHAR(80),
    etiqueta VARCHAR(80),
    FOREIGN KEY (id_transporte) REFERENCES transportes(id_transporte)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS paradas (
    id_parada INT AUTO_INCREMENT PRIMARY KEY,
    id_ruta INT NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    latitud DECIMAL(10,7),
    longitud DECIMAL(10,7),
    orden INT DEFAULT 0,
    FOREIGN KEY (id_ruta) REFERENCES rutas(id_ruta) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS instrucciones (
    id_instruccion INT AUTO_INCREMENT PRIMARY KEY,
    id_ruta INT NOT NULL,
    orden INT NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    detalle VARCHAR(400),
    tipo ENUM('caminar','bus','metro','transbordo','llegada') DEFAULT 'bus',
    FOREIGN KEY (id_ruta) REFERENCES rutas(id_ruta) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS busquedas (
    id_busqueda INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT,
    origen VARCHAR(200) NOT NULL,
    destino VARCHAR(200) NOT NULL,
    fecha_viaje DATE NULL,
    hora_salida VARCHAR(10) NULL,
    fecha_busqueda TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS rutas_favoritas (
    id_favorito INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_ruta INT NOT NULL,
    alias VARCHAR(80),
    fecha_guardado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (id_usuario, id_ruta),
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_ruta) REFERENCES rutas(id_ruta) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS alertas (
    id_alerta INT AUTO_INCREMENT PRIMARY KEY,
    id_ruta INT NULL,
    titulo VARCHAR(150) NOT NULL,
    mensaje VARCHAR(400) NOT NULL,
    severidad ENUM('info','advertencia','critica') DEFAULT 'info',
    activa TINYINT(1) DEFAULT 1,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_ruta) REFERENCES rutas(id_ruta) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
];

let ready = null;

async function seed() {
  const [transportes] = await pool.query('SELECT COUNT(*) AS total FROM transportes');
  if (transportes[0].total > 0) return;

  await pool.query(
    `INSERT INTO transportes (tipo, nombre, codigo) VALUES
      ('Bus', 'Bus Local', 'BUS-01'),
      ('Metro', 'Metro', 'METRO-01'),
      ('Integrado', 'Bus Integrado', 'INT-01')`
  );

  const rutas = [
    {
      nombre: 'Ruta Expresa Línea 4 + Metro L3',
      tiempo: 25,
      costo: 3200,
      transbordos: 1,
      transporte: 3,
      origen: 'Plaza Central',
      destino: 'Terminal del Norte',
      caminar: 3,
      resumen: 'Camina 3 min → Bus L4 (10 paradas) → Transbordo → Metro L3 (2 paradas)',
      horario: 'Cada 6 min · 5:00–23:00',
      estado: 'Tránsito fluido',
      etiqueta: 'RECOMENDADA POR MENOR TIEMPO',
      paradas: [
        ['Plaza Central', 6.25184, -75.56359],
        ['Parada Inicio L4', 6.2572, -75.5654],
        ['Estación Transbordo Metro', 6.2664, -75.5672],
        ['Terminal del Norte', 6.2768, -75.5689],
      ],
      pasos: [
        ['caminar', 'Inicio - Plaza Central', 'Camina 3 min hasta parada de Bus L4'],
        ['bus', 'Línea Expresa 4 (Bus)', 'Aborda el vehículo de la línea L4 · 10 paradas'],
        ['transbordo', 'Transbordo Estación Metro', 'Desciende del bus e ingresa a la plataforma del Metro L3'],
        ['llegada', 'Llegada - Terminal del Norte', 'Fin del trayecto estimado · 2 paradas en metro'],
      ],
    },
    {
      nombre: 'Bus Troncal T10 Directo',
      tiempo: 38,
      costo: 2500,
      transbordos: 0,
      transporte: 1,
      origen: 'Plaza Central',
      destino: 'Terminal del Norte',
      caminar: 5,
      resumen: 'Camina 5 min → Bus T10 directo (14 paradas)',
      horario: '9:50 AM · cada 12 min',
      estado: 'Servicio normal',
      etiqueta: 'MÁS ECONÓMICO',
      paradas: [
        ['Plaza Central', 6.25184, -75.56359],
        ['Avenida Regional', 6.2601, -75.5702],
        ['Terminal del Norte', 6.2768, -75.5689],
      ],
      pasos: [
        ['caminar', 'Inicio - Plaza Central', 'Camina 5 min hasta el paradero del troncal T10'],
        ['bus', 'Bus Troncal T10', 'Viaje directo, sin transbordos · 14 paradas'],
        ['llegada', 'Llegada - Terminal del Norte', 'Desciende en la bahía de buses urbanos'],
      ],
    },
    {
      nombre: 'Línea Accesible 8 + Caminata adaptada',
      tiempo: 42,
      costo: 2800,
      transbordos: 1,
      transporte: 3,
      origen: 'Plaza Central',
      destino: 'Terminal del Norte',
      caminar: 8,
      resumen: 'Camina 8 min por corredor accesible → Línea 8 → Transbordo',
      horario: 'Cada 15 min · 6:00–21:00',
      estado: 'Obras en vía',
      etiqueta: 'MÁXIMA ACCESIBILIDAD',
      paradas: [
        ['Plaza Central', 6.25184, -75.56359],
        ['Parada accesible L8', 6.2548, -75.5601],
        ['Conexión norte', 6.2689, -75.5644],
        ['Terminal del Norte', 6.2768, -75.5689],
      ],
      pasos: [
        ['caminar', 'Inicio - Plaza Central', 'Camina 8 min por el andén adaptado'],
        ['bus', 'Línea Accesible 8', 'Bus con rampa y espacio para silla de ruedas'],
        ['transbordo', 'Conexión norte', 'Cambia al alimentador hacia la terminal'],
        ['llegada', 'Llegada - Terminal del Norte', 'Acceso por la entrada principal'],
      ],
    },
    {
      nombre: 'Metro + Bus Universidad',
      tiempo: 28,
      costo: 3500,
      transbordos: 1,
      transporte: 2,
      origen: 'Plaza Central',
      destino: 'Universidad',
      caminar: 4,
      resumen: 'Camina 4 min → Metro → Bus alimentador universitario',
      horario: 'Cada 4 min · 4:30–23:00',
      estado: 'Tránsito fluido',
      etiqueta: 'MENOS TRANSBORDOS',
      paradas: [
        ['Plaza Central', 6.25184, -75.56359],
        ['Estación Metro Centro', 6.2566, -75.5661],
        ['Universidad', 6.2673, -75.5686],
      ],
      pasos: [
        ['caminar', 'Inicio - Plaza Central', 'Camina 4 min hasta la estación de metro'],
        ['metro', 'Metro línea principal', 'Baja en la estación más cercana al campus'],
        ['llegada', 'Llegada - Universidad', 'Camina hasta la portería principal'],
      ],
    },
    {
      nombre: 'Alimentador Portal',
      tiempo: 22,
      costo: 2500,
      transbordos: 0,
      transporte: 1,
      origen: 'Plaza Central',
      destino: 'Centro Comercial Portal',
      caminar: 2,
      resumen: 'Camina 2 min → Alimentador directo al Portal',
      horario: 'Cada 10 min · 6:00–22:00',
      estado: 'Servicio normal',
      etiqueta: 'DIRECTO',
      paradas: [
        ['Plaza Central', 6.25184, -75.56359],
        ['Centro Comercial Portal', 6.2304, -75.6052],
      ],
      pasos: [
        ['caminar', 'Inicio - Plaza Central', 'Camina 2 min hasta el paradero'],
        ['bus', 'Alimentador Portal', 'Servicio directo, sin transbordos'],
        ['llegada', 'Llegada - Centro Comercial Portal', 'Desciende frente al acceso peatonal'],
      ],
    },
  ];

  const rutaIds = [];
  for (const ruta of rutas) {
    const [result] = await pool.query(
      `INSERT INTO rutas
        (nombre, tiempo_estimado, costo_aproximado, transbordos, id_transporte, origen, destino, distancia_caminar, resumen, horario, estado_trafico, etiqueta)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ruta.nombre, ruta.tiempo, ruta.costo, ruta.transbordos, ruta.transporte,
        ruta.origen, ruta.destino, ruta.caminar, ruta.resumen, ruta.horario,
        ruta.estado, ruta.etiqueta,
      ]
    );
    const id = result.insertId;
    rutaIds.push(id);
    for (let i = 0; i < ruta.paradas.length; i += 1) {
      const [nombre, lat, lng] = ruta.paradas[i];
      await pool.query(
        'INSERT INTO paradas (id_ruta, nombre, latitud, longitud, orden) VALUES (?, ?, ?, ?, ?)',
        [id, nombre, lat, lng, i + 1]
      );
    }
    for (let i = 0; i < ruta.pasos.length; i += 1) {
      const [tipo, titulo, detalle] = ruta.pasos[i];
      await pool.query(
        'INSERT INTO instrucciones (id_ruta, orden, titulo, detalle, tipo) VALUES (?, ?, ?, ?, ?)',
        [id, i + 1, titulo, detalle, tipo]
      );
    }
  }

  await pool.query(
    `INSERT INTO alertas (id_ruta, titulo, mensaje, severidad) VALUES
      (?, 'Obras en vía', 'La Línea Accesible 8 tiene cierre parcial. Calcula 8 minutos extra.', 'advertencia'),
      (?, 'Metro L3 operativo', 'La línea 3 circula con frecuencia normal en este momento.', 'info'),
      (NULL, 'Demanda alta en hora pico', 'Entre 7:00 y 9:00 el troncal T10 puede salir con más ocupación.', 'info')`,
    [rutaIds[2], rutaIds[0]]
  );

  const [usuarios] = await pool.query('SELECT COUNT(*) AS total FROM usuarios');
  if (usuarios[0].total === 0) {
    const hashUsuario = await bcrypt.hash('Usuario123!', 10);
    const hashAdmin = await bcrypt.hash('Admin123!', 10);
    const [juan] = await pool.query(
      `INSERT INTO usuarios (nombre, correo, password, rol) VALUES (?, ?, ?, 'usuario')`,
      ['Juan Pérez', 'juan@rutafacil.com', hashUsuario]
    );
    await pool.query(
      `INSERT INTO usuarios (nombre, correo, password, rol) VALUES (?, ?, ?, 'administrador')`,
      ['Ana Gómez', 'admin@rutafacil.com', hashAdmin]
    );
    await pool.query(
      `INSERT INTO rutas_favoritas (id_usuario, id_ruta, alias) VALUES (?, ?, 'Al Trabajo'), (?, ?, 'Universidad')`,
      [juan.insertId, rutaIds[0], juan.insertId, rutaIds[3]]
    );
    await pool.query(
      `INSERT INTO busquedas (id_usuario, origen, destino) VALUES
        (?, 'Plaza Central', 'Terminal del Norte'),
        (?, 'Plaza Central', 'Centro Comercial Portal')`,
      [juan.insertId, juan.insertId]
    );
  }
}

function initDatabase() {
  if (!ready) {
    ready = (async () => {
      for (const sql of TABLES) {
        await pool.query(sql);
      }
      await seed();
    })().catch((error) => {
      ready = null;
      throw error;
    });
  }
  return ready;
}

module.exports = { pool, initDatabase };
