const { AppDataSource } = require("../config/configDb");
const { invalidateManyUsersCache } = require("./permisosCacheService");

/**
 * Devuelve los ids de usuarios que tienen asignado un rol específico.
 * Se usa para invalidar el caché de permisos cuando un rol cambia.
 */
const getUserIdsByRole = async (roleId) => {
    const usuarioRolRepo = AppDataSource.getRepository("UsuarioRol");
    const rels = await usuarioRolRepo.find({
        where:     { role: { id_rol: roleId } },
        relations: { usuario: true }
    });
    return rels.map(r => r.usuario?.id).filter(Boolean);
};

/**
 * Servicio de Roles
 * Contiene la lógica de negocio para el CRUD de Roles y asignación de Permisos.
 */

/** Relaciones para cargar un rol con sus permisos */
const ROLE_RELATIONS = {
    rolPermisos: {
        permiso: true
    }
};

/**
 * Formatea un rol con su lista plana de permisos para las respuestas.
 * @param {Object} role - Entidad Role con relaciones cargadas
 * @returns {Object}
 */
const formatRole = (role) => {
    const permisos = (role.rolPermisos || [])
        .filter(rp => rp.estado === "activo" && rp.permiso && rp.permiso.estado === "activo")
        .map(rp => ({
            id_permiso:  rp.permiso.id_permiso,
            nombre:      rp.permiso.nombre,
            codigo:      rp.permiso.codigo,
            modulo:      rp.permiso.modulo,
            descripcion: rp.permiso.descripcion
        }));

    return {
        id_rol:          role.id_rol,
        nombre:          role.nombre,
        descripcion:     role.descripcion,
        estado:          role.estado,
        fecha_creacion:  role.fecha_creacion,
        permisos
    };
};

/**
 * Vincula una lista de IDs de permisos a un rol dentro de un queryRunner (transacción).
 * @param {Object} queryRunner - TypeORM QueryRunner activo
 * @param {Object} role        - Entidad Role guardada
 * @param {number[]} permisosIds - Array de IDs de permisos a vincular
 */
const linkPermisos = async (queryRunner, role, permisosIds = []) => {
    if (!permisosIds.length) return;

    const rolPermisoRepo = queryRunner.manager.getRepository("RolPermiso");
    const permisoRepo    = queryRunner.manager.getRepository("Permiso");

    for (const pId of permisosIds) {
        const perm = await permisoRepo.findOneBy({ id_permiso: parseInt(pId) });
        if (perm) {
            const rp = rolPermisoRepo.create({ role, permiso: perm, estado: "activo" });
            await rolPermisoRepo.save(rp);
        }
    }
};

// ─── Servicios públicos ─────────────────────────────────────

/**
 * Retorna todos los roles con sus permisos formateados.
 */
const getRolesService = async () => {
    const roleRepo = AppDataSource.getRepository("Role");
    const roles    = await roleRepo.find({
        relations: ROLE_RELATIONS,
        order:     { id_rol: "ASC" }
    });
    return roles.map(formatRole);
};

/**
 * Crea un nuevo rol y le asigna los permisos indicados.
 * @param {string}   nombre      - Nombre del rol
 * @param {string}   descripcion - Descripción del rol
 * @param {number[]} permisos    - IDs de permisos a asignar
 * @throws Si ya existe un rol con el mismo nombre
 */
const createRoleService = async ({ nombre, descripcion, permisos = [] }) => {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
        const roleRepo = queryRunner.manager.getRepository("Role");

        // Verificar duplicado
        const existing = await roleRepo.findOne({ where: { nombre } });
        if (existing) {
            throw { status: 409, message: `Ya existe un rol con el nombre '${nombre}'` };
        }

        // Crear rol
        const newRole  = roleRepo.create({ nombre, descripcion, estado: "activo" });
        const savedRole = await roleRepo.save(newRole);

        // Vincular permisos
        await linkPermisos(queryRunner, savedRole, permisos);

        await queryRunner.commitTransaction();

        // Retornar rol completo
        const fullRole = await AppDataSource.getRepository("Role").findOne({
            where:     { id_rol: savedRole.id_rol },
            relations: ROLE_RELATIONS
        });
        return formatRole(fullRole);

    } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
    } finally {
        await queryRunner.release();
    }
};

/**
 * Actualiza un rol existente y re-sincroniza sus permisos.
 * @param {number}   roleId      - ID del rol a actualizar
 * @param {string}   nombre      - Nuevo nombre
 * @param {string}   descripcion - Nueva descripción
 * @param {number[]} permisos    - Nueva lista de IDs de permisos
 * @throws Si el rol no existe, si se intenta renombrar 'Administrador', o si hay conflicto de nombre
 */
const updateRoleService = async (roleId, { nombre, descripcion, permisos = [] }) => {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
        const roleRepo = queryRunner.manager.getRepository("Role");

        const role = await roleRepo.findOneBy({ id_rol: roleId });
        if (!role) {
            throw { status: 404, message: "Rol no encontrado" };
        }

        if (role.nombre === "Administrador" && nombre !== "Administrador") {
            throw { status: 400, message: "No se puede renombrar el rol Administrador" };
        }

        // Verificar conflicto de nombre con otro rol
        const conflict = await roleRepo.findOne({ where: { nombre } });
        if (conflict && conflict.id_rol !== roleId) {
            throw { status: 409, message: `Ya existe otro rol con el nombre '${nombre}'` };
        }

        // Actualizar campos
        role.nombre      = nombre;
        role.descripcion = descripcion;
        await roleRepo.save(role);

        // Re-sincronizar permisos: eliminar los actuales y re-vincular
        const rolPermisoRepo = queryRunner.manager.getRepository("RolPermiso");
        await rolPermisoRepo.delete({ role: { id_rol: roleId } });
        await linkPermisos(queryRunner, role, permisos);

        await queryRunner.commitTransaction();

        // Los permisos del rol cambiaron: invalidamos el caché de todos
        // los usuarios que lo tienen asignado.
        const affectedUserIds = await getUserIdsByRole(roleId);
        await invalidateManyUsersCache(affectedUserIds);

        // Retornar rol actualizado
        const updatedRole = await AppDataSource.getRepository("Role").findOne({
            where:     { id_rol: roleId },
            relations: ROLE_RELATIONS
        });
        return formatRole(updatedRole);

    } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
    } finally {
        await queryRunner.release();
    }
};

/**
 * Elimina un rol por su ID.
 * Impide la eliminación del rol 'Administrador'.
 * @param {number} roleId - ID del rol a eliminar
 * @throws Si el rol no existe o es el rol Administrador
 */
const deleteRoleService = async (roleId) => {
    const roleRepo = AppDataSource.getRepository("Role");
    const role     = await roleRepo.findOneBy({ id_rol: roleId });

    if (!role) {
        throw { status: 404, message: "Rol no encontrado" };
    }

    if (role.nombre === "Administrador") {
        throw { status: 400, message: "No se puede eliminar el rol Administrador del sistema" };
    }

    // Capturamos los usuarios afectados antes de borrar la relación
    const affectedUserIds = await getUserIdsByRole(roleId);

    await roleRepo.remove(role);

    await invalidateManyUsersCache(affectedUserIds);

    return { message: "Rol eliminado con éxito" };
};

module.exports = {
    getRolesService,
    createRoleService,
    updateRoleService,
    deleteRoleService
};
