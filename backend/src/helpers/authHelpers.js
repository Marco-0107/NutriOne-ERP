/**
 * Helpers de Autenticación y Permisos
 *
 * Funciones utilitarias para procesar datos de autenticación,
 * reutilizadas en controllers y middlewares.
 */

/**
 * Extrae la lista plana de códigos de permisos activos de un usuario,
 * a partir de sus relaciones usuarioRoles → role → rolPermisos → permiso.
 *
 * @param {Array} usuarioRoles - Relación cargada del usuario
 * @returns {string[]} - Array de códigos de permisos activos (únicos)
 */
const extractPermisos = (usuarioRoles = []) => {
    const permisos = new Set();

    for (const ur of usuarioRoles) {
        if (ur.estado !== "activo") continue;
        if (!ur.role || ur.role.estado !== "activo") continue;

        const rolPermisos = ur.role.rolPermisos || [];
        for (const rp of rolPermisos) {
            if (rp.estado !== "activo") continue;
            if (!rp.permiso || rp.permiso.estado !== "activo") continue;
            permisos.add(rp.permiso.codigo);
        }
    }

    return Array.from(permisos);
};

/**
 * Extrae los nombres de los roles activos asignados al usuario.
 *
 * @param {Array} usuarioRoles - Relación cargada del usuario
 * @returns {string[]} - Array de nombres de roles activos
 */
const extractRoles = (usuarioRoles = []) => {
    return usuarioRoles
        .filter(ur => ur.estado === "activo" && ur.role && ur.role.estado === "activo")
        .map(ur => ur.role.nombre);
};

/**
 * Construye el objeto de usuario a retornar en las respuestas de auth,
 * sin exponer datos sensibles (como la contraseña).
 *
 * @param {Object} user       - Entidad Usuario con relaciones cargadas
 * @param {string[]} permisos - Lista de códigos de permisos
 * @param {string[]} roles    - Lista de nombres de roles
 * @returns {Object}
 */
const buildUserPayload = (user, permisos, roles) => ({
    id:               user.id,
    rut:              user.rut,
    nombres:          user.nombres,
    apellido_paterno: user.apellido_paterno,
    apellido_materno: user.apellido_materno,
    correo:           user.correo,
    permisos,
    roles
});

module.exports = {
    extractPermisos,
    extractRoles,
    buildUserPayload
};
