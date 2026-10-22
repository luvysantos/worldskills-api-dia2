const { Router } = require("express");
const { listarActivas } = require("../controllers/categoriaController");
const { autenticar } = require("../middleware/auth");

const router = Router();

router.get("/", autenticar, listarActivas);

module.exports = router;
