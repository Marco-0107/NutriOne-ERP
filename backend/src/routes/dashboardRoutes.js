"use strict";
const express = require("express");
const router  = express.Router();

const {
    getResumenFinancieroController,
    getResumenAgendaController,
} = require("../controllers/dashboardController");

const authMiddleware       = require("../middlewares/authMiddleware");
const permissionMiddleware = require("../middlewares/permissionMiddleware");

router.get("/resumen-financiero", authMiddleware, permissionMiddleware("dashboard:ver"), getResumenFinancieroController);
router.get("/resumen-agenda",     authMiddleware, permissionMiddleware("dashboard:ver"), getResumenAgendaController);

module.exports = router;
