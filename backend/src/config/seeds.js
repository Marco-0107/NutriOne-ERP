const bcrypt = require("bcryptjs");
const { SEED_PERMISSIONS } = require("./seedPermissions");

/**
 * Función de Semillas (Seeds) de la Base de Datos
 *
 * Se ejecuta al iniciar el backend. Verifica si los datos esenciales
 * existen y los crea si no están presentes:
 *  1. Permisos del sistema (definidos en seedPermissions.js)
 *  2. Rol "Administrador" con todos los permisos
 *  3. Usuario administrador por defecto (admin@nutrione.cl / admin123)
 */
async function seedDatabase(AppDataSource) {
    console.log("[Seed] Iniciando verificación de datos esenciales...");

    try {
        const permisoRepo    = AppDataSource.getRepository("Permiso");
        const roleRepo       = AppDataSource.getRepository("Role");
        const usuarioRepo    = AppDataSource.getRepository("Usuario");
        const rolPermisoRepo = AppDataSource.getRepository("RolPermiso");
        const usuarioRolRepo = AppDataSource.getRepository("UsuarioRol");

        // ─── 1. Sembrar permisos definidos en initialPermissions.js ───
        for (const pData of SEED_PERMISSIONS) {
            let permiso = await permisoRepo.findOne({ where: { codigo: pData.codigo } });
            if (!permiso) {
                permiso = permisoRepo.create(pData);
                await permisoRepo.save(permiso);
                console.log(`[Seed] Permiso creado: ${pData.codigo}`);
            }
        }

        // Obtener TODOS los permisos activos (incluyendo los ya existentes)
        const allPermissions = await permisoRepo.find({ where: { estado: "activo" } });

        // ─── 2. Sembrar Rol Administrador ───
        let adminRole = await roleRepo.findOne({ where: { nombre: "Administrador" } });
        if (!adminRole) {
            adminRole = roleRepo.create({
                nombre: "Administrador",
                descripcion: "Administrador con acceso total al sistema",
                estado: "activo"
            });
            await roleRepo.save(adminRole);
            console.log("[Seed] Rol 'Administrador' creado.");
        }

        // ─── 3. Asignar TODOS los permisos al rol Administrador ───
        for (const perm of allPermissions) {
            const exists = await rolPermisoRepo.findOne({
                where: {
                    role:    { id_rol: adminRole.id_rol },
                    permiso: { id_permiso: perm.id_permiso }
                }
            });
            if (!exists) {
                const rp = rolPermisoRepo.create({
                    role:    adminRole,
                    permiso: perm,
                    estado:  "activo"
                });
                await rolPermisoRepo.save(rp);
                console.log(`[Seed] Permiso '${perm.codigo}' asignado a Administrador.`);
            }
        }

        // ─── 4. Sembrar Usuario Administrador ───
        let adminUser = await usuarioRepo.findOne({ where: { correo: "admin@nutrione.cl" } });
        if (!adminUser) {
            const salt           = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash("admin123", salt);

            adminUser = usuarioRepo.create({
                rut:              "12345678-9",
                nombres:          "Admin",
                apellido_paterno: "NutriOne",
                apellido_materno: "ERP",
                correo:           "admin@nutrione.cl",
                contrasena:       hashedPassword,
                estado:           "activo"
            });
            await usuarioRepo.save(adminUser);
            console.log("[Seed] Usuario administrador creado (admin@nutrione.cl / admin123).");
        }

        // ─── 5. Asignar Rol Administrador al usuario admin ───
        const hasRole = await usuarioRolRepo.findOne({
            where: {
                usuario: { id: adminUser.id },
                role:    { id_rol: adminRole.id_rol }
            }
        });
        if (!hasRole) {
            const ur = usuarioRolRepo.create({
                usuario: adminUser,
                role:    adminRole,
                estado:  "activo"
            });
            await usuarioRolRepo.save(ur);
            console.log("[Seed] Rol 'Administrador' asignado al usuario admin.");
        }

        console.log("[Seed] Verificación completada exitosamente.");
    } catch (error) {
        console.error("[Seed] Error durante la verificación de datos esenciales:", error);
    }
}

module.exports = { seedDatabase };
