const db = require("../config/db");
const { exito } = require("../utils/respuesta");

function listarActivas(req, res) {
  const categorias = db
    .prepare("SELECT * FROM categoria WHERE estado = 'ACTIVA' ORDER BY nombre")
    .all();
  return exito(res, { datos: categorias });
}

module.exports = { listarActivas };
