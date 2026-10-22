const db = require("../config/db");
const { error } = require("../utils/respuesta");

function autenticar(req, res, next) {
  const cabecera = req.headers["authorization"];

  if (!cabecera || !cabecera.startsWith("Bearer ")) {
    return error(res, { mensaje: "Token no proporcionado", codigo: 401 });
  }

  const token = cabecera.slice("Bearer ".length).trim();

  const registro = db
    .prepare(
      `SELECT t.id_token, t.id_usuario, t.fecha_expiracion, t.activo,
              u.usuario, u.estado AS estado_usuario, u.id_rol, r.nombre AS nombre_rol
        FROM token_acceso t
        JOIN usuario u ON u.id_usuario = t.id_usuario
        JOIN rol r ON r.id_rol = u.id_rol
        WHERE t.token = ?`
    )
    .get(token);

  if (!registro || !registro.activo) {
    return error(res, { mensaje: "Token inválido o inactivo", codigo: 401 });
  }

  if (new Date(registro.fecha_expiracion) < new Date()) {
    return error(res, { mensaje: "Token expirado", codigo: 401 });
  }

  if (registro.estado_usuario !== "ACTIVO") {
    return error(res, { mensaje: "Usuario inactivo", codigo: 401 });
  }

  req.usuario = {
    id_usuario: registro.id_usuario,
    usuario: registro.usuario,
    id_rol: registro.id_rol,
    nombre_rol: registro.nombre_rol,
  };
  req.token = token;

  next();
}

function soloRol(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.usuario || !rolesPermitidos.includes(req.usuario.nombre_rol)) {
      return error(res, { mensaje: "No tiene permisos para esta acción", codigo: 403 });
    }
    next();
  };
}

function adminOPropietario(obtenerIdPropietario) {
  return (req, res, next) => {
    if (req.usuario.nombre_rol === "ADMINISTRADOR") return next();

    const idPropietario = obtenerIdPropietario(req);

    if (idPropietario === null || idPropietario === undefined) {
      return error(res, { mensaje: "Recurso no encontrado", codigo: 404 });
    }

    if (idPropietario !== req.usuario.id_usuario) {
      return error(res, { mensaje: "No tiene permisos sobre este recurso", codigo: 403 });
    }

    next();
  };
}

module.exports = { autenticar, soloRol, adminOPropietario };