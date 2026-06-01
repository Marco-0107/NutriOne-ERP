const express = require("express");
const router = express.Router();
const {
    getNutricionistas,
    getDisponibilidad,
    agendarCita,
} = require("../controllers/citaPublicaController");

router.get("/nutricionistas", getNutricionistas);
router.get("/disponibilidad/:nutricionistaId", getDisponibilidad);
router.post("/agendar", agendarCita);

module.exports = router;
