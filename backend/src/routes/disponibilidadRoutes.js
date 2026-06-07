const express   = require("express");
const router    = express.Router();
const { getDisponibilidad, createDisponibilidad, updateDisponibilidad, deleteDisponibilidad } = require("../controllers/disponibilidadController");
const authMiddleware       = require("../middlewares/authMiddleware");
const permissionMiddleware = require("../middlewares/permissionMiddleware");

router.get("/",      authMiddleware, permissionMiddleware("disponibilidad:ver"),        getDisponibilidad);
router.post("/",     authMiddleware, permissionMiddleware("disponibilidad:gestionar"),  createDisponibilidad);
router.put("/:id",   authMiddleware, permissionMiddleware("disponibilidad:gestionar"),  updateDisponibilidad);
router.delete("/:id", authMiddleware, permissionMiddleware("disponibilidad:gestionar"), deleteDisponibilidad);

module.exports = router;
