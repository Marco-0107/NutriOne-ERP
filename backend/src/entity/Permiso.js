const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
    name: "Permiso",
    tableName: "permisos",
    columns: {
        id_permiso: {
            primary: true,
            type: "int",
            generated: true,
        },
        nombre: {
            type: "varchar",
            length: 100,
            nullable: false,
        },
        codigo: {
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
        modulo: {
            type: "varchar",
            length: 100,
            nullable: false,
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
        rolPermisos: {
            type: "one-to-many",
            target: "RolPermiso",
            inverseSide: "permiso",
        },
    },
});
