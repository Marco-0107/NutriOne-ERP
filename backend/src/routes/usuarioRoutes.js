const express   = require("express");
const router    = express.Router();
const { getUsuarios, createUsuario, updateUsuario, deleteUsuario, assignRol } = require("../controllers/usuarioController");
const authMiddleware       = require("../middlewares/authMiddleware");
const permissionMiddleware = require("../middlewares/permissionMiddleware");

router.get("/",       authMiddleware, permissionMiddleware("usuarios:ver"),      getUsuarios);
router.post("/",      authMiddleware, permissionMiddleware("usuarios:crear"),    createUsuario);
router.put("/:id",    authMiddleware, permissionMiddleware("usuarios:editar"),   updateUsuario);
router.delete("/:id",    authMiddleware, permissionMiddleware("usuarios:eliminar"), deleteUsuario);
router.put("/:id/rol",  authMiddleware, assignRol);

module.exports = router;
