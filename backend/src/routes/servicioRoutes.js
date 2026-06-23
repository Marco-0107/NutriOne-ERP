const express = require("express");
const router  = express.Router();
const { getServicios, getServicioById, createServicio, updateServicio, deleteServicio } = require("../controllers/servicioController");
const authMiddleware       = require("../middlewares/authMiddleware");
const permissionMiddleware = require("../middlewares/permissionMiddleware");

router.get("/",       authMiddleware, permissionMiddleware("servicios:ver"),      getServicios);
router.get("/:id",    authMiddleware, permissionMiddleware("servicios:ver"),      getServicioById);
router.post("/",      authMiddleware, permissionMiddleware("servicios:crear"),    createServicio);
router.put("/:id",    authMiddleware, permissionMiddleware("servicios:editar"),   updateServicio);
router.delete("/:id", authMiddleware, permissionMiddleware("servicios:eliminar"), deleteServicio);

module.exports = router;
