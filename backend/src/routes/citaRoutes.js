const express = require("express");
const router  = express.Router();
const { getCitas, getCitaById, createCita, updateCita, cancelarCita } = require("../controllers/citaController");
const authMiddleware       = require("../middlewares/authMiddleware");
const permissionMiddleware = require("../middlewares/permissionMiddleware");

router.get("/",               authMiddleware, permissionMiddleware("citas:ver"),      getCitas);
router.get("/:id",            authMiddleware, permissionMiddleware("citas:ver"),      getCitaById);
router.post("/",              authMiddleware, permissionMiddleware("citas:crear"),    createCita);
router.put("/:id",            authMiddleware, permissionMiddleware("citas:editar"),   updateCita);
router.patch("/:id/cancelar", authMiddleware, permissionMiddleware("citas:cancelar"), cancelarCita);

module.exports = router;
