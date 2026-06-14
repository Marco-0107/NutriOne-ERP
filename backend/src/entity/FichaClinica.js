const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
    name: "FichaClinica",
    tableName: "ficha_clinica",
    columns: {
        id_ficha: {
            primary: true,
            type: "int",
            generated: true,
        },
        tipo: {
            type: "varchar",
            length: 50,
            nullable: false,
        },
        fecha_atencion: {
            name: "fecha_atencion",
            type: "date",
            nullable: false,
        },
        edad: {
            type: "int",
            nullable: false,
        },
        peso: {
            type: "numeric",
            precision: 5,
            scale: 2,
            nullable: true,
        },
        talla: {
            type: "numeric",
            precision: 5,
            scale: 2,
            nullable: true,
        },
        nombre_social: {
            type: "varchar",
            length: 200,
            nullable: true,
        },
        sexo: {
            type: "varchar",
            length: 30,
            nullable: true,
        },
        presion_arterial: {
            type: "varchar",
            length: 20,
            nullable: true,
        },
        circunferencia_cintura: {
            type: "numeric",
            precision: 5,
            scale: 2,
            nullable: true,
        },
        calculos: {
            type: "text",
            nullable: true,
        },
        diagnostico_nutricional: {
            type: "text",
            nullable: true,
        },
        motivo_consulta: {
            type: "text",
            nullable: true,
        },
        observacion: {
            type: "text",
            nullable: true,
        },
        indicaciones: {
            type: "text",
            nullable: true,
        },
        recomendaciones: {
            type: "text",
            nullable: true,
        },
        derivaciones: {
            type: "text",
            nullable: true,
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
        cita: {
            type: "one-to-one",
            target: "Cita",
            inverseSide: "fichaClinica",
            joinColumn: { name: "id_cita" },
            onDelete: "CASCADE",
        },
    },
});
