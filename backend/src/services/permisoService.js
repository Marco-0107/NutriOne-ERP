const { AppDataSource } = require("../config/configDb");

/**
 * Servicio de Permisos
 * Contiene la lógica de negocio para el módulo de Permisos.
 */

/**
 * Obtiene todos los permisos activos ordenados por módulo y nombre.
 *
 * @returns {Array} - Lista de permisos activos
 */
const getPermisosService = async () => {
    const permisoRepo = AppDataSource.getRepository("Permiso");

    const permisos = await permisoRepo.find({
        where: { estado: "activo" },
        order: { modulo: "ASC", nombre: "ASC" }
    });

    return permisos;
};

module.exports = {
    getPermisosService
};
