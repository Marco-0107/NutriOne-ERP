const jwt = require("jsonwebtoken");
const { AppDataSource } = require("../config/configDb");
const { ACCESS_TOKEN_SECRET } = require("../config/configEnv");
const { extractPermisos, extractRoles, buildUserPayload } = require("../helpers/authHelpers");
const { unauthorized, serverError } = require("../handlers/errorHandler");
const {
    getUserPayloadFromCache,
    setUserPayloadInCache
} = require("../services/permisosCacheService");

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
 * Verifica el token Bearer en el header Authorization.
 *
 * Flujo optimizado con caché Redis:
 *   1. Decodifica el JWT.
 *   2. Intenta leer el payload del usuario (roles + permisos) desde Redis.
 *   3. Si hay HIT → adjunta a req.user y continúa (sin tocar la BD).
 *   4. Si hay MISS → carga el usuario completo desde la BD,
 *      reconstruye el payload, lo guarda en Redis con TTL y continúa.
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

        // 3. Intentar leer el payload desde Redis (camino rápido)
        const cached = await getUserPayloadFromCache(decoded.id);
        if (cached) {
            req.user = cached;
            return next();
        }

        // 4. MISS → cargar usuario activo con relaciones desde la BD
        const usuarioRepo = AppDataSource.getRepository("Usuario");
        const user = await usuarioRepo.findOne({
            where:     { id: decoded.id, estado: "activo" },
            relations: USER_RELATIONS
        });

        if (!user) {
            return unauthorized(res, "Usuario no encontrado o inactivo");
        }

        // 5. Extraer permisos y roles, construir payload
        const permisos = extractPermisos(user.usuarioRoles);
        const roles    = extractRoles(user.usuarioRoles);
        const payload  = buildUserPayload(user, permisos, roles);

        // 6. Cachear para próximas requests (no esperamos errores: best-effort)
        await setUserPayloadInCache(user.id, payload);

        req.user = payload;
        next();
    } catch (error) {
        return serverError(res, error, "authMiddleware");
    }
};

module.exports = authMiddleware;
