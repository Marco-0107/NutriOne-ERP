const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
    name: "Transaccion",
    tableName: "transacciones",
    columns: {
        id_transaccion: {
            primary: true,
            type: "int",
            generated: true,
        },
        monto: {
            type: "numeric",
            precision: 10,
            scale: 2,
            nullable: false,
        },
        metodo_pago: {
            name: "metodo_pago",
            type: "varchar",
            length: 100,
            nullable: false,
        },
        estado_pago: {
            name: "estado_pago",
            type: "varchar",
            length: 50,
            default: "pendiente",
        },
        fecha_pago: {
            name: "fecha_pago",
            type: "timestamp with time zone",
            nullable: true,
        },
        codigo_transaccion: {
            name: "codigo_transaccion",
            type: "varchar",
            length: 150,
            unique: true,
            nullable: true,
        },
        notas: {
            type: "text",
            nullable: true,
        },
    },
    relations: {
        cita: {
            type: "many-to-one",
            target: "Cita",
            inverseSide: "transacciones",
            joinColumn: { name: "id_cita" },
            onDelete: "CASCADE",
        },
        cobro: {
            type: "many-to-one",
            target: "Cobro",
            inverseSide: "pagos",
            joinColumn: { name: "id_cobro" },
            nullable: true,
            onDelete: "CASCADE",
        },
    },
});
