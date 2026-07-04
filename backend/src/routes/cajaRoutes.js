"use strict";
const express = require("express");
const router  = express.Router();

const {
    generarCobroController,
    getCobrosController,
    getCobroController,
    registrarPagoController,
    getResumenPacienteController,
    getMovimientosCajaController,
    getResumenCajaController,
    anularCobroController,
} = require("../controllers/cajaController");

const authMiddleware       = require("../middlewares/authMiddleware");
const permissionMiddleware = require("../middlewares/permissionMiddleware");

router.post(   "/cobros",              authMiddleware, permissionMiddleware("caja:cobrar"), generarCobroController);
router.get(    "/cobros",              authMiddleware, permissionMiddleware("caja:ver"),    getCobrosController);
router.get(    "/cobros/:id",          authMiddleware, permissionMiddleware("caja:ver"),    getCobroController);
router.post(   "/cobros/:id/pagos",    authMiddleware, permissionMiddleware("caja:cobrar"), registrarPagoController);
router.patch(  "/cobros/:id/anular",   authMiddleware, permissionMiddleware("caja:anular"), anularCobroController);
router.get(    "/paciente/:id_paciente", authMiddleware, permissionMiddleware("caja:ver"), getResumenPacienteController);
router.get(    "/resumen",             authMiddleware, permissionMiddleware("caja:ver"),    getResumenCajaController);
router.get(    "/movimientos",         authMiddleware, permissionMiddleware("caja:ver"),    getMovimientosCajaController);

module.exports = router;
