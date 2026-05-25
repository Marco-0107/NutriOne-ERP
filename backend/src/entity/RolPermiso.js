const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
    name: "RolPermiso",
    tableName: "rol_permiso",
    columns: {
        id_rol_permiso: {
            primary: true,
            type: "int",
            generated: true,
        },
        fecha_asignacion: {
            name: "fecha_asignacion",
            type: "timestamp with time zone",
            default: () => "CURRENT_TIMESTAMP",
        },
        estado: {
            type: "varchar",
            length: 50,
            default: "activo",
        },
    },
    relations: {
        role: {
            type: "many-to-one",
            target: "Role",
            inverseSide: "rolPermisos",
            joinColumn: { name: "id_rol" },
            onDelete: "CASCADE",
        },
        permiso: {
            type: "many-to-one",
            target: "Permiso",
            inverseSide: "rolPermisos",
            joinColumn: { name: "id_permiso" },
            onDelete: "CASCADE",
        },
    },
});
