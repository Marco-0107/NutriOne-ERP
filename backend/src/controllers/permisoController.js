const { getPermisosService } = require("../services/permisoService");
const { serverError }        = require("../handlers/errorHandler");

/**
 * Controller de Permisos
 * Delega lógica al Service y responde HTTP.
 */

/**
 * GET /api/permisos
 * Retorna todos los permisos activos del sistema.
 */
const getPermisos = async (req, res) => {
    try {
        const permisos = await getPermisosService();
        return res.json({ success: true, data: permisos });
    } catch (err) {
        return serverError(res, err, "permisoController.getPermisos");
    }
};

module.exports = { getPermisos };
