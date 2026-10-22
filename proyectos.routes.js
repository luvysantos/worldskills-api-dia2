const { Router } = require("express");
const proyectoController = require("../controllers/proyectoController");
const tareaController = require("../controllers/tareaController");
const { autenticar } = require("../middleware/auth");

const router = Router();

router.use(autenticar);

// ---- Proyectos ----
router.get("/", proyectoController.listar);
router.post("/", proyectoController.crear);
router.get("/:id", proyectoController.obtener);
router.patch("/:id", proyectoController.actualizar);
router.put("/:id", proyectoController.actualizar);
router.delete("/:id", proyectoController.eliminar);

// ---- Tareas anidadas bajo un proyecto ----
router.get("/:id_proyecto/tareas", tareaController.verificarAccesoProyecto, tareaController.listar);
router.post("/:id_proyecto/tareas", tareaController.verificarAccesoProyecto, tareaController.crear);
router.get("/:id_proyecto/tareas/:id_tarea", tareaController.verificarAccesoProyecto, tareaController.obtener);
router.patch("/:id_proyecto/tareas/:id_tarea", tareaController.verificarAccesoProyecto, tareaController.actualizar);
router.put("/:id_proyecto/tareas/:id_tarea", tareaController.verificarAccesoProyecto, tareaController.actualizar);
router.delete("/:id_proyecto/tareas/:id_tarea", tareaController.verificarAccesoProyecto, tareaController.eliminar);

module.exports = router;
