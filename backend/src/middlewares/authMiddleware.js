const jwt = require("jsonwebtoken");
const { AppDataSource } = require("../config/configDb");
const { ACCESS_TOKEN_SECRET } = require("../config/configEnv");
const { extractPermisos, extractRoles, buildUserPayload } = require("../helpers/authHelpers");
const { unauthorized, serverError } = require("../handlers/errorHandler");

/** Relaciones necesarias para cargar al usuario con roles y permisos */
const USER_RELATIONS = {
    usuarioRoles: {
        role: {
            rolPermisos: {
                permiso: true
            }
        }
    }
};

/**
 * Middleware de Autenticación JWT
 *
 * Verifica el token Bearer en el header Authorization,
 * carga el usuario desde la base de datos con sus roles y permisos activos,
 * y los adjunta a req.user para que estén disponibles en controllers.
 */
const authMiddleware = async (req, res, next) => {
    try {
        // 1. Extraer token del header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return unauthorized(res, "No autorizado: token no proporcionado");
        }

        const token = authHeader.split(" ")[1];
        if (!token) {
            return unauthorized(res, "No autorizado: formato de token inválido");
        }

        // 2. Verificar y decodificar el token
        let decoded;
        try {
            decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);
        } catch {
            return unauthorized(res, "Sesión inválida o expirada. Por favor, inicia sesión nuevamente.");
        }

        // 3. Cargar usuario activo con sus relaciones desde la DB
        const usuarioRepo = AppDataSource.getRepository("Usuario");
        const user = await usuarioRepo.findOne({
            where:     { id: decoded.id, estado: "activo" },
            relations: USER_RELATIONS
        });

        if (!user) {
            return unauthorized(res, "Usuario no encontrado o inactivo");
        }

        // 4. Extraer permisos y roles usando helpers
        const permisos = extractPermisos(user.usuarioRoles);
        const roles    = extractRoles(user.usuarioRoles);

        // 5. Adjuntar payload al request
        req.user = buildUserPayload(user, permisos, roles);

        next();
    } catch (error) {
        return serverError(res, error, "authMiddleware");
    }
};

module.exports = authMiddleware;
