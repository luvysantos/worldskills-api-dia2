const { Router } = require("express");
const { login, logout } = require("../controllers/authController");
const { autenticar } = require("../middleware/auth");

const router = Router();

router.post("/login", login);
router.post("/logout", autenticar, logout);

module.exports = router;
