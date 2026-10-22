const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const db = require("../config/db");
const { exito, error } = require("../utils/respuesta");

const HORAS_EXPIRACION = Number(process.env.TOKEN_EXPIRACION_HORAS || 8);

function login(req, res) {
  const { usuario, contrasena } = req.body;

  if (!usuario || !contrasena) {
    return error(res, { mensaje: "usuario y contrasena son obligatorios", codigo: 400 });
  }

  const fila = db
    .prepare(
      `SELECT u.*, r.nombre AS nombre_rol
       FROM usuario u JOIN rol r ON r.id_rol = u.id_rol
       WHERE u.usuario = ?`
    )
    .get(usuario);

  if (!fila) {
    return error(res, { mensaje: "Credenciales inválidas", codigo: 401 });
  }

  if (fila.estado !== "ACTIVO") {
    return error(res, { mensaje: "El usuario se encuentra inactivo", codigo: 401 });
  }

  const contrasenaValida = bcrypt.compareSync(contrasena, fila.contrasena);
  if (!contrasenaValida) {
    return error(res, { mensaje: "Credenciales inválidas", codigo: 401 });
  }

  const token = crypto.randomBytes(32).toString("hex");
  const ahora = new Date();
  const expiracion = new Date(ahora.getTime() + HORAS_EXPIRACION * 60 * 60 * 1000);

  db.prepare(
    `INSERT INTO token_acceso (id_usuario, token, fecha_creacion, fecha_expiracion, activo)
     VALUES (?, ?, ?, ?, 1)`
  ).run(fila.id_usuario, token, ahora.toISOString(), expiracion.toISOString());

  return exito(res, {
    codigo: 200,
    datos: {
      token,
      tipo: "Bearer",
      expira: expiracion.toISOString(),
      usuario: {
        id_usuario: fila.id_usuario,
        nombre: fila.nombre,
        usuario: fila.usuario,
        rol: fila.nombre_rol,
      },
    },
  });
}

function logout(req, res) {
  db.prepare("UPDATE token_acceso SET activo = 0 WHERE token = ?").run(req.token);
  return exito(res, { mensaje: "Sesión cerrada correctamente", datos: null });
}

module.exports = { login, logout };
