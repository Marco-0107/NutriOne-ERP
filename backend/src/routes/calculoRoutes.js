const express = require("express");
const router  = express.Router();
const {
    previewCalculo,
    crearEvaluacion,
    actualizarEvaluacion,
    getEvaluacionPorFicha,
    getHistorialPorPaciente,
    getPatologias,
} = require("../controllers/calculoController");
const authMiddleware       = require("../middlewares/authMiddleware");
const permissionMiddleware = require("../middlewares/permissionMiddleware");

// Catálogo de patologías + Factor Patología (selector de hospitalizados)
router.get("/patologias", authMiddleware, permissionMiddleware("calculos:ver"), getPatologias);

// Cálculo en vivo sin guardar
router.post("/preview", authMiddleware, permissionMiddleware("calculos:ver"), previewCalculo);

// Evaluación asociada a una ficha
router.get("/ficha/:id_ficha",  authMiddleware, permissionMiddleware("calculos:ver"),       getEvaluacionPorFicha);
router.post("/ficha/:id_ficha", authMiddleware, permissionMiddleware("calculos:gestionar"), crearEvaluacion);

// Actualizar evaluación
router.put("/:id", authMiddleware, permissionMiddleware("calculos:gestionar"), actualizarEvaluacion);

// Historial por paciente (insumo para evolución)
router.get("/paciente/:id_paciente", authMiddleware, permissionMiddleware("calculos:ver"), getHistorialPorPaciente);

module.exports = router;
