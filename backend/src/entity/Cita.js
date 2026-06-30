const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
    name: "Cita",
    tableName: "citas",
    columns: {
        id_cita: {
            primary: true,
            type: "int",
            generated: true,
        },
        fecha: {
            type: "date",
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
        estado: {
            type: "varchar",
            length: 50,
            default: "pendiente",
        },
        motivo_cancelacion: {
            name: "motivo_cancelacion",
            type: "varchar",
            length: 255,
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
        observacion: {
            type: "text",
            nullable: true,
        },
        origen: {
            type: "varchar",
            length: 20,
            default: "interna",
        },
    },
    relations: {
        paciente: {
            type: "many-to-one",
            target: "Paciente",
            inverseSide: "citas",
            joinColumn: { name: "id_paciente" },
            onDelete: "CASCADE",
        },
        usuario: {
            type: "many-to-one",
            target: "Usuario",
            inverseSide: "citas",
            joinColumn: { name: "id_usuario" },
            onDelete: "CASCADE",
        },
        servicio: {
            type: "many-to-one",
            target: "Servicio",
            inverseSide: "citas",
            joinColumn: { name: "id_servicio" },
            onDelete: "CASCADE",
        },
        fichaClinica: {
            type: "one-to-one",
            target: "FichaClinica",
            inverseSide: "cita",
        },
        transacciones: {
            type: "one-to-many",
            target: "Transaccion",
            inverseSide: "cita",
        },
        cobro: {
            type: "one-to-one",
            target: "Cobro",
            inverseSide: "cita",
        },
    },
});
