const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
    name: "MedidaAlimento",
    tableName: "medidas_alimento",
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
        gramos: {
            type: "decimal",
            precision: 8,
            scale: 2,
            nullable: false,
        },
    },
    relations: {
        alimento: {
            type: "many-to-one",
            target: "Alimento",
            inverseSide: "medidas",
            joinColumn: { name: "id_alimento" },
            onDelete: "CASCADE",
        },
    },
});
