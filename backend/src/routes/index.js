const express = require("express");
const authRoutes     = require("./authRoutes");
const roleRoutes     = require("./roleRoutes");
const permisoRoutes  = require("./permisoRoutes");
const usuarioRoutes  = require("./usuarioRoutes");
const pacienteRoutes = require("./pacienteRoutes");

const router = express.Router();

router.use("/auth",      authRoutes);
router.use("/roles",     roleRoutes);
router.use("/permisos",  permisoRoutes);
router.use("/usuarios",  usuarioRoutes);
router.use("/pacientes", pacienteRoutes);

module.exports = router;
