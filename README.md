# Ruta Fácil (RutaLocal)

PWA para buscar transporte público: origen y destino, tiempo, costo, transbordos, instrucciones y mapa. El backend es Node.js con Express y MySQL en Clever Cloud. El frontend es React, Tailwind CSS y Vite.

## Requisitos

- Node.js 20 o superior
- Las variables de Clever Cloud en `backend-app-rutas-inteligentes/.env` (usa `.env.example` como plantilla)

## Desarrollo

En una terminal, la API:

```bash
cd backend-app-rutas-inteligentes
npm install
npm run dev
```

En otra, la PWA:

```bash
cd frontend-app-rutas-inteligentes
npm install
npm run dev
```

Abre http://localhost:5173. Vite reenvía `/api` a http://localhost:3000.

Cuentas de prueba que crea la base la primera vez:

- Pasajero: `juan@rutafacil.com` / `Usuario123!`
- Administrador: `admin@rutafacil.com` / `Admin123!`

## Despliegue en Vercel

Son dos proyectos, porque el frontend y la API viven en carpetas distintas.

1. Proyecto del frontend
   - Root Directory: `frontend-app-rutas-inteligentes`
   - Framework: Vite
   - Variable: `VITE_API_URL` = URL pública del backend, sin barra final. Ejemplo: `https://tu-api.vercel.app`
2. Proyecto del backend
   - Root Directory: `backend-app-rutas-inteligentes`
   - Framework: Other
   - Variables: `MYSQL_ADDON_HOST`, `MYSQL_ADDON_DB`, `MYSQL_ADDON_USER`, `MYSQL_ADDON_PORT`, `MYSQL_ADDON_PASSWORD`, `JWT_SECRET`

La API expone Express en `index.js` y `vercel.json` la publica como función de Node. Al primer request crea las tablas y los datos de ejemplo si la base está vacía.

No subas el archivo `.env`. Las credenciales solo van en el panel de Vercel.
