const express = require("express");
const router = express.Router();
const {
    getNutricionistas,
    getDisponibilidad,
    getCitasPublicasCalendario,
    enviarOtp,
    verificarOtp,
    agendarCita,
} = require("../controllers/citaPublicaController");

router.get("/nutricionistas", getNutricionistas);
router.get("/disponibilidad/:nutricionistaId", getDisponibilidad);
router.get("/citas/calendario", getCitasPublicasCalendario);
router.post("/enviar-otp", enviarOtp);
router.post("/verificar-otp", verificarOtp);
router.post("/agendar", agendarCita);

module.exports = router;
