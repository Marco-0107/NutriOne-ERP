const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
    name: "Paciente",
    tableName: "paciente",
    columns: {
        id: {
            primary: true,
            type: "int",
            generated: true,
        },
        fecha_nacimiento: {
            name: "fecha_nacimiento",
            type: "date",
            nullable: false,
        },
        prevision: {
            type: "varchar",
            length: 100,
            nullable: true,
        },
        telefono: {
            type: "varchar",
            length: 20,
            nullable: true,
        },
    },
    relations: {
        usuario: {
            type: "one-to-one",
            target: "Usuario",
            inverseSide: "paciente",
            joinColumn: { name: "id_user" },
            onDelete: "CASCADE",
        },
        citas: {
            type: "one-to-many",
            target: "Cita",
            inverseSide: "paciente",
        },
    },
});
