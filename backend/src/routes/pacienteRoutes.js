const express   = require("express");
const router    = express.Router();
const { getPacientes, createPaciente, updatePaciente, deletePaciente } = require("../controllers/pacienteController");
const authMiddleware       = require("../middlewares/authMiddleware");
const permissionMiddleware = require("../middlewares/permissionMiddleware");

router.get("/",    authMiddleware, permissionMiddleware("pacientes:ver"),      getPacientes);
router.post("/",   authMiddleware, permissionMiddleware("pacientes:crear"),    createPaciente);
router.put("/:id", authMiddleware, permissionMiddleware("pacientes:editar"),   updatePaciente);
router.delete("/:id", authMiddleware, permissionMiddleware("pacientes:eliminar"), deletePaciente);

module.exports = router;
