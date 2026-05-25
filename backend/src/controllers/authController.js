const { loginSchema }            = require("../validations/authValidations");
const { loginService, getMeService } = require("../services/authService");
const { badRequest, serverError }    = require("../handlers/errorHandler");

/**
 * Controller de Autenticación
 * Valida inputs con Joi → delega lógica al Service → responde HTTP.
 */

/**
 * POST /api/auth/login
 * Autentica al usuario y retorna el token JWT junto con el perfil y permisos.
 */
const login = async (req, res) => {
    // 1. Validar input con Joi
    const { error, value } = loginSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const messages = error.details.map(d => d.message).join(". ");
        return badRequest(res, messages);
    }

    try {
        // 2. Delegar lógica al servicio
        const result = await loginService(value.correo, value.contrasena);

        // 3. Responder con éxito
        return res.json({ success: true, ...result });

    } catch (err) {
        if (err.status) {
            return res.status(err.status).json({ success: false, message: err.message });
        }
        return serverError(res, err, "authController.login");
    }
};

/**
 * GET /api/auth/me
 * Retorna el perfil del usuario autenticado (requiere token válido via authMiddleware).
 */
const me = async (req, res) => {
    try {
        const result = getMeService(req.user);
        return res.json({ success: true, ...result });
    } catch (err) {
        return serverError(res, err, "authController.me");
    }
};

module.exports = { login, me };
