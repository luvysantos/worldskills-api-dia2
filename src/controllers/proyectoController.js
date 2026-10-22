const db = require("../config/db");
const { exito, error } = require("../utils/respuesta");

const ESTADOS_VALIDOS = ["PENDIENTE", "EN_PROCESO", "FINALIZADO"];

// Incluye el nombre del dueño del proyecto (propietario_nombre / propietario_usuario),
// útil para que el ADMINISTRADOR sepa de quién es cada proyecto/tarea sin una tabla nueva.
function obtenerProyectoPorId(id) {
  return db
    .prepare(
      `SELECT p.*, u.nombre AS propietario_nombre, u.usuario AS propietario_usuario
      FROM proyecto p JOIN usuario u ON u.id_usuario = p.id_usuario
      WHERE p.id_proyecto = ?`
    )
    .get(id);
}

// GET /api/proyectos?busqueda=&estado=&pagina=&limite=
function listar(req, res) {
  const { busqueda = "", estado = "" } = req.query;
  const pagina = Math.max(parseInt(req.query.pagina) || 1, 1);
  const limite = Math.min(Math.max(parseInt(req.query.limite) || 10, 1), 100);
  const offset = (pagina - 1) * limite;

  const condiciones = [];
  const parametros = {};

  // USUARIO solo ve sus propios proyectos; ADMINISTRADOR ve todos
  if (req.usuario.nombre_rol !== "ADMINISTRADOR") {
    condiciones.push("p.id_usuario = @id_usuario");
    parametros.id_usuario = req.usuario.id_usuario;
  }

  if (busqueda) {
    condiciones.push("(p.nombre LIKE @busqueda OR p.descripcion LIKE @busqueda)");
    parametros.busqueda = `%${busqueda}%`;
  }

  if (estado) {
    if (!ESTADOS_VALIDOS.includes(estado)) {
      return error(res, { mensaje: `estado inválido, use: ${ESTADOS_VALIDOS.join(", ")}`, codigo: 400 });
    }
    condiciones.push("p.estado = @estado");
    parametros.estado = estado;
  }

  const whereSql = condiciones.length ? `WHERE ${condiciones.join(" AND ")}` : "";

  const total = db
    .prepare(`SELECT COUNT(*) AS n FROM proyecto p ${whereSql}`)
    .get(parametros).n;

  const proyectos = db
    .prepare(
      `SELECT p.*, u.nombre AS propietario_nombre, u.usuario AS propietario_usuario
      FROM proyecto p JOIN usuario u ON u.id_usuario = p.id_usuario
      ${whereSql}
      ORDER BY p.id_proyecto DESC LIMIT @limite OFFSET @offset`
    )
    .all({ ...parametros, limite, offset });

  return exito(res, {
    datos: {
      proyectos,
      paginacion: {
        pagina,
        limite,
        total,
        totalPaginas: Math.ceil(total / limite) || 1,
      },
    },
  });
}

function obtener(req, res) {
  const proyecto = obtenerProyectoPorId(req.params.id);
  if (!proyecto) return error(res, { mensaje: "Proyecto no encontrado", codigo: 404 });

  if (req.usuario.nombre_rol !== "ADMINISTRADOR" && proyecto.id_usuario !== req.usuario.id_usuario) {
    return error(res, { mensaje: "No tiene permisos sobre este recurso", codigo: 403 });
  }

  return exito(res, { datos: proyecto });
}

function crear(req, res) {
  const { nombre, descripcion = null, fecha_inicio, fecha_fin = null, estado = "PENDIENTE" } = req.body;

  const errores = [];
  if (!nombre || !nombre.trim()) errores.push("nombre es obligatorio");
  if (!fecha_inicio) errores.push("fecha_inicio es obligatoria");
  if (estado && !ESTADOS_VALIDOS.includes(estado)) {
    errores.push(`estado inválido, use: ${ESTADOS_VALIDOS.join(", ")}`);
  }
  if (fecha_fin && fecha_inicio && new Date(fecha_fin) < new Date(fecha_inicio)) {
    errores.push("fecha_fin no puede ser anterior a fecha_inicio");
  }
  if (errores.length) return error(res, { mensaje: "Datos inválidos", codigo: 422, errores });

  const resultado = db
    .prepare(
      `INSERT INTO proyecto (nombre, descripcion, fecha_inicio, fecha_fin, estado, id_usuario)
      VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(nombre.trim(), descripcion, fecha_inicio, fecha_fin, estado, req.usuario.id_usuario);

  const proyecto = obtenerProyectoPorId(resultado.lastInsertRowid);
  return exito(res, { datos: proyecto, mensaje: "Proyecto creado", codigo: 201 });
}

function actualizar(req, res) {
  const proyecto = obtenerProyectoPorId(req.params.id);
  if (!proyecto) return error(res, { mensaje: "Proyecto no encontrado", codigo: 404 });

  if (req.usuario.nombre_rol !== "ADMINISTRADOR" && proyecto.id_usuario !== req.usuario.id_usuario) {
    return error(res, { mensaje: "No tiene permisos sobre este recurso", codigo: 403 });
  }

  const {
    nombre = proyecto.nombre,
    descripcion = proyecto.descripcion,
    fecha_inicio = proyecto.fecha_inicio,
    fecha_fin = proyecto.fecha_fin,
    estado = proyecto.estado,
  } = req.body;

  const errores = [];
  if (!nombre || !nombre.trim()) errores.push("nombre no puede estar vacío");
  if (!ESTADOS_VALIDOS.includes(estado)) {
    errores.push(`estado inválido, use: ${ESTADOS_VALIDOS.join(", ")}`);
  }
  if (fecha_fin && fecha_inicio && new Date(fecha_fin) < new Date(fecha_inicio)) {
    errores.push("fecha_fin no puede ser anterior a fecha_inicio");
  }
  if (errores.length) return error(res, { mensaje: "Datos inválidos", codigo: 422, errores });

  db.prepare(
    `UPDATE proyecto SET nombre = ?, descripcion = ?, fecha_inicio = ?, fecha_fin = ?, estado = ?
    WHERE id_proyecto = ?`
  ).run(nombre.trim(), descripcion, fecha_inicio, fecha_fin, estado, proyecto.id_proyecto);

  return exito(res, { datos: obtenerProyectoPorId(proyecto.id_proyecto), mensaje: "Proyecto actualizado" });
}

function eliminar(req, res) {
  const proyecto = obtenerProyectoPorId(req.params.id);
  if (!proyecto) return error(res, { mensaje: "Proyecto no encontrado", codigo: 404 });

  if (req.usuario.nombre_rol !== "ADMINISTRADOR" && proyecto.id_usuario !== req.usuario.id_usuario) {
    return error(res, { mensaje: "No tiene permisos sobre este recurso", codigo: 403 });
  }

  db.prepare("DELETE FROM proyecto WHERE id_proyecto = ?").run(proyecto.id_proyecto);
  return exito(res, { mensaje: "Proyecto eliminado", datos: null });
}

module.exports = { listar, obtener, crear, actualizar, eliminar, obtenerProyectoPorId };
