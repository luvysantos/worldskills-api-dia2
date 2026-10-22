const db = require("../config/db");
const { exito, error } = require("../utils/respuesta");
const { obtenerProyectoPorId } = require("./proyectoController");

const PRIORIDADES_VALIDAS = ["BAJA", "MEDIA", "ALTA"];
const ESTADOS_VALIDOS = ["PENDIENTE", "EN_PROCESO", "COMPLETADA"];

function obtenerTareaPorId(idProyecto, idTarea) {
  return db
    .prepare("SELECT * FROM tarea WHERE id_tarea = ? AND id_proyecto = ?")
    .get(idTarea, idProyecto);
}
function verificarAccesoProyecto(req, res, next) {
  const proyecto = obtenerProyectoPorId(req.params.id_proyecto);
  if (!proyecto) return error(res, { mensaje: "Proyecto no encontrado", codigo: 404 });

  if (req.usuario.nombre_rol !== "ADMINISTRADOR" && proyecto.id_usuario !== req.usuario.id_usuario) {
    return error(res, { mensaje: "No tiene permisos sobre este proyecto", codigo: 403 });
  }

  req.proyecto = proyecto;
  next();
}

function listar(req, res) {
  const { busqueda = "", estado = "", prioridad = "" } = req.query;
  const pagina = Math.max(parseInt(req.query.pagina) || 1, 1);
  const limite = Math.min(Math.max(parseInt(req.query.limite) || 10, 1), 100);
  const offset = (pagina - 1) * limite;

  const condiciones = ["id_proyecto = @id_proyecto"];
  const parametros = { id_proyecto: req.proyecto.id_proyecto };

  if (busqueda) {
    condiciones.push("(titulo LIKE @busqueda OR descripcion LIKE @busqueda)");
    parametros.busqueda = `%${busqueda}%`;
  }
  if (estado) {
    if (!ESTADOS_VALIDOS.includes(estado)) {
      return error(res, { mensaje: `estado inválido, use: ${ESTADOS_VALIDOS.join(", ")}`, codigo: 400 });
    }
    condiciones.push("estado = @estado");
    parametros.estado = estado;
  }
  if (prioridad) {
    if (!PRIORIDADES_VALIDAS.includes(prioridad)) {
      return error(res, { mensaje: `prioridad inválida, use: ${PRIORIDADES_VALIDAS.join(", ")}`, codigo: 400 });
    }
    condiciones.push("prioridad = @prioridad");
    parametros.prioridad = prioridad;
  }

  const whereSql = `WHERE ${condiciones.join(" AND ")}`;

  const total = db.prepare(`SELECT COUNT(*) AS n FROM tarea ${whereSql}`).get(parametros).n;

  const tareas = db
    .prepare(`SELECT * FROM tarea ${whereSql} ORDER BY id_tarea DESC LIMIT @limite OFFSET @offset`)
    .all({ ...parametros, limite, offset });

  return exito(res, {
    datos: {
      tareas,
      paginacion: { pagina, limite, total, totalPaginas: Math.ceil(total / limite) || 1 },
    },
  });
}

function obtener(req, res) {
  const tarea = obtenerTareaPorId(req.proyecto.id_proyecto, req.params.id_tarea);
  if (!tarea) return error(res, { mensaje: "Tarea no encontrada", codigo: 404 });
  return exito(res, { datos: tarea });
}

function validarDatos({ titulo, id_categoria, prioridad, estado, fecha_limite }, requerirTitulo) {
  const errores = [];
  if (requerirTitulo && (!titulo || !titulo.trim())) errores.push("titulo es obligatorio");
  if (prioridad && !PRIORIDADES_VALIDAS.includes(prioridad)) {
    errores.push(`prioridad inválida, use: ${PRIORIDADES_VALIDAS.join(", ")}`);
  }
  if (estado && !ESTADOS_VALIDOS.includes(estado)) {
    errores.push(`estado inválido, use: ${ESTADOS_VALIDOS.join(", ")}`);
  }
  if (id_categoria) {
    const categoria = db.prepare("SELECT * FROM categoria WHERE id_categoria = ?").get(id_categoria);
    if (!categoria) errores.push("id_categoria no existe");
  }
  return errores;
}

function crear(req, res) {
  const {
    titulo,
    descripcion = null,
    id_categoria = null,
    prioridad = "MEDIA",
    estado = "PENDIENTE",
    fecha_limite = null,
  } = req.body;

  const errores = validarDatos(req.body, true);
  if (errores.length) return error(res, { mensaje: "Datos inválidos", codigo: 422, errores });

  const resultado = db
    .prepare(
      `INSERT INTO tarea (titulo, descripcion, id_proyecto, id_categoria, prioridad, estado, fecha_limite)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(titulo.trim(), descripcion, req.proyecto.id_proyecto, id_categoria, prioridad, estado, fecha_limite);

  const tarea = obtenerTareaPorId(req.proyecto.id_proyecto, resultado.lastInsertRowid);
  return exito(res, { datos: tarea, mensaje: "Tarea creada", codigo: 201 });
}

function actualizar(req, res) {
  const tarea = obtenerTareaPorId(req.proyecto.id_proyecto, req.params.id_tarea);
  if (!tarea) return error(res, { mensaje: "Tarea no encontrada", codigo: 404 });

  const errores = validarDatos(req.body, false);
  if (errores.length) return error(res, { mensaje: "Datos inválidos", codigo: 422, errores });

  const datos = {
    titulo: req.body.titulo?.trim() ?? tarea.titulo,
    descripcion: req.body.descripcion ?? tarea.descripcion,
    id_categoria: req.body.id_categoria ?? tarea.id_categoria,
    prioridad: req.body.prioridad ?? tarea.prioridad,
    estado: req.body.estado ?? tarea.estado,
    fecha_limite: req.body.fecha_limite ?? tarea.fecha_limite,
  };

  db.prepare(
    `UPDATE tarea SET titulo = @titulo, descripcion = @descripcion, id_categoria = @id_categoria,
       prioridad = @prioridad, estado = @estado, fecha_limite = @fecha_limite
     WHERE id_tarea = @id_tarea`
  ).run({ ...datos, id_tarea: tarea.id_tarea });

  return exito(res, {
    datos: obtenerTareaPorId(req.proyecto.id_proyecto, tarea.id_tarea),
    mensaje: "Tarea actualizada",
  });
}

function eliminar(req, res) {
  const tarea = obtenerTareaPorId(req.proyecto.id_proyecto, req.params.id_tarea);
  if (!tarea) return error(res, { mensaje: "Tarea no encontrada", codigo: 404 });

  db.prepare("DELETE FROM tarea WHERE id_tarea = ?").run(tarea.id_tarea);
  return exito(res, { mensaje: "Tarea eliminada", datos: null });
}

module.exports = { listar, obtener, crear, actualizar, eliminar, verificarAccesoProyecto };
