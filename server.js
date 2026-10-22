require("dotenv").config();

// Inicializar la base de datos y los datos de prueba
require("./src/config/seed");

// Cargar la aplicación Express
const app = require("./src/app");

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`API escuchando en http://localhost:${PORT}`);
});
