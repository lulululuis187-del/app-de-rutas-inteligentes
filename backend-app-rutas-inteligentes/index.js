require('dotenv').config();
const app = require('./src/app');

const port = process.env.PORT || 3000;

if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`API de Ruta Fácil en http://localhost:${port}`);
  });
}

module.exports = app;
