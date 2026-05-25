const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
    name: "Servicio",
    tableName: "servicios",
    columns: {
        id: {
            primary: true,
            type: "int",
            generated: true,
        },
        nombre: {
            type: "varchar",
            length: 150,
            nullable: false,
        },
        descripcion: {
            type: "text",
            nullable: true,
        },
        precio: {
            type: "numeric",
            precision: 10,
            scale: 2,
            nullable: false,
        },
        duracion_minutos: {
            name: "duracion_minutos",
            type: "int",
            nullable: false,
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
            inverseSide: "servicios",
            joinColumn: { name: "id_user" },
            onDelete: "CASCADE",
        },
        citas: {
            type: "one-to-many",
            target: "Cita",
            inverseSide: "servicio",
        },
    },
});
