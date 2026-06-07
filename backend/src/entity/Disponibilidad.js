const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
    name: "Disponibilidad",
    tableName: "disponibilidad",
    columns: {
        id_disponibilidad: {
            primary: true,
            type: "int",
            generated: true,
        },
        dia_semana: {
            name: "dia_semana",
            type: "varchar",
            length: 50,
            nullable: false,
        },
        hora_inicio: {
            name: "hora_inicio",
            type: "time",
            nullable: false,
        },
        hora_fin: {
            name: "hora_fin",
            type: "time",
            nullable: false,
        },
        duracion_minutos: {
            name: "duracion_minutos",
            type: "int",
            nullable: false,
            default: 30,
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
            inverseSide: "disponibilidades",
            joinColumn: { name: "id_user" },
            onDelete: "CASCADE",
        },
    },
});
