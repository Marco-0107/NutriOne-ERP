"use strict";
const { EntitySchema } = require("typeorm");

// Estados: pendiente | pagado_parcial | pagado | anulado
module.exports = new EntitySchema({
    name: "Cobro",
    tableName: "cobros",
    columns: {
        id_cobro: {
            primary: true,
            type: "int",
            generated: true,
        },
        monto_total: {
            name: "monto_total",
            type: "numeric",
            precision: 10,
            scale: 2,
            nullable: false,
        },
        monto_pagado: {
            name: "monto_pagado",
            type: "numeric",
            precision: 10,
            scale: 2,
            nullable: false,
            default: 0,
        },
        estado: {
            type: "varchar",
            length: 30,
            nullable: false,
            default: "pendiente",
        },
        notas: {
            type: "text",
            nullable: true,
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
        cita: {
            type: "many-to-one",
            target: "Cita",
            inverseSide: "cobro",
            joinColumn: { name: "id_cita" },
            onDelete: "CASCADE",
        },
        pagos: {
            type: "one-to-many",
            target: "Transaccion",
            inverseSide: "cobro",
        },
    },
});
