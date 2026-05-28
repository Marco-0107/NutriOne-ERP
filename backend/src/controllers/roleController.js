const { createRoleSchema, updateRoleSchema } = require("../validations/roleValidations");
const {
    getRolesService,
    createRoleService,
    updateRoleService,
    deleteRoleService
} = require("../services/roleService");
const { badRequest, serverError } = require("../handlers/errorHandler");

/**
 * Controller de Roles
 * Valida inputs con Joi → delega lógica al Service → responde HTTP.
 */

/**
 * GET /api/roles
 * Retorna todos los roles con sus permisos asignados.
 */
const getRoles = async (req, res) => {
    try {
        const roles = await getRolesService();
        return res.json({ success: true, data: roles });
    } catch (err) {
        return serverError(res, err, "roleController.getRoles");
    }
};

/**
 * POST /api/roles
 * Crea un nuevo rol y le asigna los permisos indicados.
 */
const createRole = async (req, res) => {
    // 1. Validar input con Joi
    const { error, value } = createRoleSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const messages = error.details.map(d => d.message).join(". ");
        return badRequest(res, messages);
    }

    try {
        const role = await createRoleService(value);
        return res.status(201).json({ success: true, data: role });
    } catch (err) {
        if (err.status) {
            return res.status(err.status).json({ success: false, message: err.message });
        }
        return serverError(res, err, "roleController.createRole");
    }
};

/**
 * PUT /api/roles/:id
 * Actualiza nombre, descripción y permisos de un rol existente.
 */
const updateRole = async (req, res) => {
    const roleId = parseInt(req.params.id);
    if (isNaN(roleId)) {
        return badRequest(res, "El ID del rol debe ser un número válido");
    }

    // 1. Validar input con Joi
    const { error, value } = updateRoleSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const messages = error.details.map(d => d.message).join(". ");
        return badRequest(res, messages);
    }

    try {
        const role = await updateRoleService(roleId, value);
        return res.json({ success: true, data: role });
    } catch (err) {
        if (err.status) {
            return res.status(err.status).json({ success: false, message: err.message });
        }
        return serverError(res, err, "roleController.updateRole");
    }
};

/**
 * DELETE /api/roles/:id
 * Elimina un rol del sistema (excepto el rol Administrador).
 */
const deleteRole = async (req, res) => {
    const roleId = parseInt(req.params.id);
    if (isNaN(roleId)) {
        return badRequest(res, "El ID del rol debe ser un número válido");
    }

    try {
        const result = await deleteRoleService(roleId);
        return res.json({ success: true, ...result });
    } catch (err) {
        if (err.status) {
            return res.status(err.status).json({ success: false, message: err.message });
        }
        return serverError(res, err, "roleController.deleteRole");
    }
};

module.exports = { getRoles, createRole, updateRole, deleteRole };
