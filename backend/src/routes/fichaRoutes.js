const express = require("express");
const router  = express.Router();
const { getFichaByCita, createFicha, updateFicha, getFichasByPaciente } = require("../controllers/fichaController");
const authMiddleware       = require("../middlewares/authMiddleware");
const permissionMiddleware = require("../middlewares/permissionMiddleware");

// GET  /fichas/paciente/:id_paciente → todas las fichas de un paciente (evolución clínica)
router.get(
    "/paciente/:id_paciente",
    authMiddleware,
    permissionMiddleware("fichas:ver"),
    getFichasByPaciente
);

// GET  /fichas/cita/:id_cita  → obtener ficha por cita (o null si no existe)
router.get(
    "/cita/:id_cita",
    authMiddleware,
    permissionMiddleware("fichas:ver"),
    getFichaByCita
);

// POST /fichas/cita/:id_cita  → crear nueva ficha vinculada a la cita
router.post(
    "/cita/:id_cita",
    authMiddleware,
    permissionMiddleware("fichas:crear"),
    createFicha
);

// PUT  /fichas/:id_ficha       → actualizar ficha existente
router.put(
    "/:id_ficha",
    authMiddleware,
    permissionMiddleware("fichas:editar"),
    updateFicha
);

module.exports = router;
