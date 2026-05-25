const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
    name: "Role",
    tableName: "roles",
    columns: {
        id_rol: {
            primary: true,
            type: "int",
            generated: true,
        },
        nombre: {
            type: "varchar",
            length: 100,
            unique: true,
            nullable: false,
        },
        descripcion: {
            type: "varchar",
            length: 255,
            nullable: true,
        },
        estado: {
            type: "varchar",
            length: 50,
            default: "activo",
        },
        fecha_creacion: {
            name: "fecha_creacion",
            type: "timestamp with time zone",
            createDate: true,
        },
        fecha_actualizacion: {
            name: "fecha_actualizacion",
            type: "timestamp with time zone",
            updateDate: true,
        },
    },
    relations: {
        usuarioRoles: {
            type: "one-to-many",
            target: "UsuarioRol",
            inverseSide: "role",
        },
        rolPermisos: {
            type: "one-to-many",
            target: "RolPermiso",
            inverseSide: "role",
        },
    },
});
