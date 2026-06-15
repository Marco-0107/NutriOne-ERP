const express = require("express");
const authRoutes     = require("./authRoutes");
const roleRoutes     = require("./roleRoutes");
const permisoRoutes  = require("./permisoRoutes");
const usuarioRoutes  = require("./usuarioRoutes");
const pacienteRoutes = require("./pacienteRoutes");
const disponibilidadRoutes = require("./disponibilidadRoutes");
const citaPublicaRoutes = require("./citaPublicaRoutes");
const citaRoutes        = require("./citaRoutes");
const fichaRoutes       = require("./fichaRoutes");
const calculoRoutes     = require("./calculoRoutes");

const router = express.Router();

router.use("/auth",      authRoutes);
router.use("/roles",     roleRoutes);
router.use("/permisos",  permisoRoutes);
router.use("/usuarios",  usuarioRoutes);
router.use("/pacientes", pacienteRoutes);
router.use("/disponibilidad", disponibilidadRoutes);
router.use("/citas",   citaRoutes);
router.use("/fichas",  fichaRoutes);
router.use("/calculos", calculoRoutes);
router.use("/public",  citaPublicaRoutes);

module.exports = router;
