const express = require('express');
const router   = express.Router();
const { getRoles, createRole, updateRole, deleteRole } = require('../controllers/roleController');
const authMiddleware        = require('../middlewares/authMiddleware');
const permissionMiddleware  = require('../middlewares/permissionMiddleware');

// Rutas protegidas por autenticación y permiso granular
router.get('/',            authMiddleware, permissionMiddleware('roles:ver'),    getRoles);
router.post('/',           authMiddleware, permissionMiddleware('roles:crear'),  createRole);
router.put('/:id',         authMiddleware, permissionMiddleware('roles:editar'), updateRole);
router.delete('/:id',      authMiddleware, permissionMiddleware('roles:eliminar'), deleteRole);

module.exports = router;
