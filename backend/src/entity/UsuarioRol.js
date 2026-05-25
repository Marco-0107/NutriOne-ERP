const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
    name: "UsuarioRol",
    tableName: "usuario_rol",
    columns: {
        id_usuario_rol: {
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
        usuario: {
            type: "many-to-one",
            target: "Usuario",
            inverseSide: "usuarioRoles",
            joinColumn: { name: "id_usuario" },
            onDelete: "CASCADE",
        },
        role: {
            type: "many-to-one",
            target: "Role",
            inverseSide: "usuarioRoles",
            joinColumn: { name: "id_rol" },
            onDelete: "CASCADE",
        },
    },
});
