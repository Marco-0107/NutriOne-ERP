const express = require("express");
const router = express.Router();
const { enviarOtp, verificarOtp, consultar } = require("../controllers/evolucionPublicaController");

router.post("/enviar-otp", enviarOtp);
router.post("/verificar-otp", verificarOtp);
router.post("/consultar", consultar);

module.exports = router;
