const express = require("express");
const { getPermisos } = require("../controllers/permisoController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", authMiddleware, getPermisos);

module.exports = router;
