const { EntitySchema } = require("typeorm");

module.exports = new EntitySchema({
    name: "Usuario",
    tableName: "usuarios",
    columns: {
        id: {
            primary: true,
            type: "int",
            generated: true,
        },
        rut: {
            type: "varchar",
            length: 20,
            unique: true,
            nullable: false,
        },
        nombres: {
            type: "varchar",
            length: 150,
            nullable: false,
        },
        apellido_paterno: {
            type: "varchar",
            length: 100,
            nullable: false,
        },
        apellido_materno: {
            type: "varchar",
            length: 100,
            nullable: false,
        },
        correo: {
            type: "varchar",
            length: 150,
            unique: true,
            nullable: false,
        },
        contrasena: {
            type: "varchar",
            length: 255,
            nullable: false,
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
        usuarioRoles: {
            type: "one-to-many",
            target: "UsuarioRol",
            inverseSide: "usuario",
        },
        paciente: {
            type: "one-to-one",
            target: "Paciente",
            inverseSide: "usuario",
        },
        servicios: {
            type: "one-to-many",
            target: "Servicio",
            inverseSide: "usuario",
        },
        disponibilidades: {
            type: "one-to-many",
            target: "Disponibilidad",
            inverseSide: "usuario",
        },
        citas: {
            type: "one-to-many",
            target: "Cita",
            inverseSide: "usuario",
        },
    },
});
