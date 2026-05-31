const { AppDataSource } = require("../config/configDb");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const PACIENTE_RELATIONS = { usuario: true };

const formatPaciente = (paciente) => ({
    id:               paciente.id,
    fecha_nacimiento: paciente.fecha_nacimiento,
    prevision:        paciente.prevision,
    usuario: paciente.usuario
        ? {
              id:               paciente.usuario.id,
              rut:              paciente.usuario.rut,
              nombres:          paciente.usuario.nombres,
              apellido_paterno: paciente.usuario.apellido_paterno,
              apellido_materno: paciente.usuario.apellido_materno,
              estado:           paciente.usuario.estado,
          }
        : null,
});

const getPacientesService = async () => {
    const pacienteRepo = AppDataSource.getRepository("Paciente");
    const pacientes    = await pacienteRepo.find({
        relations: PACIENTE_RELATIONS,
        order:     { id: "ASC" },
    });
    return pacientes.map(formatPaciente);
};

const createPacienteService = async ({
    rut, nombres, apellido_paterno, apellido_materno,
    fecha_nacimiento, prevision,
}) => {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
        const usuarioRepo  = queryRunner.manager.getRepository("Usuario");
        const pacienteRepo = queryRunner.manager.getRepository("Paciente");

        const existingRut = await usuarioRepo.findOne({ where: { rut } });
        if (existingRut) {
            throw { status: 409, message: `Ya existe un paciente o usuario con el RUT '${rut}'` };
        }

        // Credenciales internas: el paciente no gestiona su propio acceso al sistema
        const rutBase        = rut.replace(/[^0-9kK]/gi, '').toLowerCase();
        const correoInterno  = `pac.${rutBase}@nutrione.internal`;
        const passInterno    = crypto.randomBytes(32).toString("hex");
        const salt           = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(passInterno, salt);

        const newUsuario = usuarioRepo.create({
            rut,
            nombres,
            apellido_paterno,
            apellido_materno,
            correo:     correoInterno,
            contrasena: hashedPassword,
            estado:     "activo",
        });
        const savedUsuario = await usuarioRepo.save(newUsuario);

        const newPaciente = pacienteRepo.create({
            fecha_nacimiento,
            prevision: prevision || null,
            usuario:   savedUsuario,
        });
        const savedPaciente = await pacienteRepo.save(newPaciente);

        await queryRunner.commitTransaction();

        const fullPaciente = await AppDataSource.getRepository("Paciente").findOne({
            where:     { id: savedPaciente.id },
            relations: PACIENTE_RELATIONS,
        });
        return formatPaciente(fullPaciente);

    } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
    } finally {
        await queryRunner.release();
    }
};

const updatePacienteService = async (pacienteId, {
    rut, nombres, apellido_paterno, apellido_materno,
    fecha_nacimiento, prevision,
}) => {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
        const pacienteRepo = queryRunner.manager.getRepository("Paciente");
        const usuarioRepo  = queryRunner.manager.getRepository("Usuario");

        const paciente = await pacienteRepo.findOne({
            where:     { id: pacienteId },
            relations: { usuario: true },
        });

        if (!paciente) {
            throw { status: 404, message: "Paciente no encontrado" };
        }

        if (rut && rut !== paciente.usuario.rut) {
            const rutConflict = await usuarioRepo.findOne({ where: { rut } });
            if (rutConflict && rutConflict.id !== paciente.usuario.id) {
                throw { status: 409, message: `Ya existe un paciente o usuario con el RUT '${rut}'` };
            }

            // Actualizar también el correo interno para mantener coherencia
            const rutBase            = rut.replace(/[^0-9kK]/gi, '').toLowerCase();
            paciente.usuario.correo  = `pac.${rutBase}@nutrione.internal`;
        }

        const usuario = paciente.usuario;
        if (rut              !== undefined) usuario.rut              = rut;
        if (nombres          !== undefined) usuario.nombres          = nombres;
        if (apellido_paterno !== undefined) usuario.apellido_paterno = apellido_paterno;
        if (apellido_materno !== undefined) usuario.apellido_materno = apellido_materno;
        await usuarioRepo.save(usuario);

        if (fecha_nacimiento !== undefined) paciente.fecha_nacimiento = fecha_nacimiento;
        if (prevision        !== undefined) paciente.prevision        = prevision || null;
        await pacienteRepo.save(paciente);

        await queryRunner.commitTransaction();

        const updated = await AppDataSource.getRepository("Paciente").findOne({
            where:     { id: pacienteId },
            relations: PACIENTE_RELATIONS,
        });
        return formatPaciente(updated);

    } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
    } finally {
        await queryRunner.release();
    }
};

const deletePacienteService = async (pacienteId) => {
    const pacienteRepo = AppDataSource.getRepository("Paciente");
    const usuarioRepo  = AppDataSource.getRepository("Usuario");

    const paciente = await pacienteRepo.findOne({
        where:     { id: pacienteId },
        relations: { usuario: true },
    });

    if (!paciente) {
        throw { status: 404, message: "Paciente no encontrado" };
    }

    if (paciente.usuario) {
        await usuarioRepo.remove(paciente.usuario);
    } else {
        await pacienteRepo.remove(paciente);
    }

    return { message: "Paciente eliminado con éxito" };
};

module.exports = {
    getPacientesService,
    createPacienteService,
    updatePacienteService,
    deletePacienteService,
};
