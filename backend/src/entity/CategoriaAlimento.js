const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
    name: "CategoriaAlimento",
    tableName: "categorias_alimento",
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
        icono: {
            type: "varchar",
            length: 10,
            nullable: false,
            default: "🍽️",
        },
    },
    relations: {
        alimentos: {
            type: "one-to-many",
            target: "Alimento",
            inverseSide: "categoria",
        },
    },
});
