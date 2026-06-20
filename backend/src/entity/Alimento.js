const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
    name: "Alimento",
    tableName: "alimentos",
    columns: {
        id: {
            primary: true,
            type: "int",
            generated: true,
        },
        nombre: {
            type: "varchar",
            length: 200,
            nullable: false,
        },
        energia_kcal: {
            type: "decimal",
            precision: 8,
            scale: 1,
            nullable: false,
            default: 0,
        },
        proteinas_g: {
            type: "decimal",
            precision: 6,
            scale: 2,
            nullable: false,
            default: 0,
        },
        carbohidratos_g: {
            type: "decimal",
            precision: 6,
            scale: 2,
            nullable: false,
            default: 0,
        },
        grasas_g: {
            type: "decimal",
            precision: 6,
            scale: 2,
            nullable: false,
            default: 0,
        },
        fibra_g: {
            type: "decimal",
            precision: 6,
            scale: 2,
            nullable: false,
            default: 0,
        },
        sodio_mg: {
            type: "decimal",
            precision: 8,
            scale: 1,
            nullable: false,
            default: 0,
        },
    },
    relations: {
        categoria: {
            type: "many-to-one",
            target: "CategoriaAlimento",
            inverseSide: "alimentos",
            joinColumn: { name: "id_categoria" },
            nullable: true,
            eager: false,
        },
        medidas: {
            type: "one-to-many",
            target: "MedidaAlimento",
            inverseSide: "alimento",
            eager: false,
        },
    },
});
