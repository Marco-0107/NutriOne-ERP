const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { AppDataSource } = require("../config/configDb");
const { ACCESS_TOKEN_SECRET } = require("../config/configEnv");
const { extractPermisos, extractRoles, buildUserPayload } = require("../helpers/authHelpers");

/** Relaciones necesarias para cargar usuarios con roles y permisos */
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
 * Verifica las credenciales del usuario y retorna el token JWT + payload.
 *
 * @param {string} correo     - Correo electrónico del usuario
 * @param {string} contrasena - Contraseña en texto plano
 * @returns {{ token: string, user: Object }}
 * @throws {Error} Si las credenciales son incorrectas o el usuario está inactivo
 */
const loginService = async (correo, contrasena) => {
    const usuarioRepo = AppDataSource.getRepository("Usuario");

    const user = await usuarioRepo.findOne({
        where: { correo, estado: "activo" },
        relations: USER_RELATIONS
    });

    if (!user) {
        throw { status: 401, message: "Credenciales incorrectas" };
    }

    const isPasswordValid = await bcrypt.compare(contrasena, user.contrasena);
    if (!isPasswordValid) {
        throw { status: 401, message: "Credenciales incorrectas" };
    }

    const permisos = extractPermisos(user.usuarioRoles);
    const roles    = extractRoles(user.usuarioRoles);

    const token = jwt.sign(
        { id: user.id, correo: user.correo },
        ACCESS_TOKEN_SECRET,
        { expiresIn: "24h" }
    );

    return {
        token,
        user: buildUserPayload(user, permisos, roles)
    };
};

/**
 * Retorna el perfil del usuario autenticado (ya resuelto por el middleware).
 *
 * @param {Object} userFromMiddleware - req.user inyectado por authMiddleware
 * @returns {Object}
 */
const getMeService = (userFromMiddleware) => {
    return { user: userFromMiddleware };
};

module.exports = {
    loginService,
    getMeService
};
