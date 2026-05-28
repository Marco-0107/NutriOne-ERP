const express = require("express");
const authRoutes = require("./authRoutes");
const roleRoutes = require("./roleRoutes");
const permisoRoutes = require("./permisoRoutes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/roles", roleRoutes);
router.use("/permisos", permisoRoutes);

module.exports = router;
