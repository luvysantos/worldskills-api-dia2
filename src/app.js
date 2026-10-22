const express = require("express");
const { error } = require("./utils/respuesta");

const autenticacionRoutes = require("./routes/autenticacion.routes");
const categoriasRoutes = require("./routes/categorias.routes");
const proyectosRoutes = require("./routes/proyectos.routes");

const app = express();

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Authorization, Content-Type");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.use(express.json());

app.get("/api/salud", (req, res) => res.json({ exito: true, mensaje: "API activa" }));

app.use("/api/autenticacion", autenticacionRoutes);
app.use("/api/categorias", categoriasRoutes);
app.use("/api/proyectos", proyectosRoutes);

// 404
app.use((req, res) => error(res, { mensaje: "Ruta no encontrada", codigo: 404 }));

app.use((err, req, res, next) => {
  console.error(err);
  return error(res, { mensaje: "Error interno del servidor", codigo: 500 });
});

module.exports = app;
