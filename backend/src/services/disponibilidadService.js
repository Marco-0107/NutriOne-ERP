const { AppDataSource } = require("../config/configDb");

const DISP_RELATIONS = { usuario: true };

const formatDisponibilidad = (disp) => ({
    id_disponibilidad: disp.id_disponibilidad,
    dia_semana:        disp.dia_semana,
    hora_inicio:       disp.hora_inicio,
    hora_fin:          disp.hora_fin,
    duracion_minutos:  disp.duracion_minutos ?? 30,
    estado:            disp.estado,
    usuario: disp.usuario
        ? {
              id:               disp.usuario.id,
              nombres:          disp.usuario.nombres,
              apellido_paterno: disp.usuario.apellido_paterno,
          }
        : null,
});

/**
 * Get all disponibilidad entries for a specific nutricionista.
 * If nutricionistaId is provided, filters by that user.
 * Otherwise returns all.
 */
const getDisponibilidadService = async (nutricionistaId = null) => {
    const repo = AppDataSource.getRepository("Disponibilidad");
    const where = { estado: "activo" };
    if (nutricionistaId) {
        where.usuario = { id: parseInt(nutricionistaId) };
    }
    const disponibilidades = await repo.find({
        where,
        relations: DISP_RELATIONS,
        order: { dia_semana: "ASC", hora_inicio: "ASC" },
    });
    return disponibilidades.map(formatDisponibilidad);
};

const createDisponibilidadService = async (nutricionistaId, { dia_semana, hora_inicio, hora_fin, duracion_minutos = 30 }) => {
    const repo = AppDataSource.getRepository("Disponibilidad");
    const usuarioRepo = AppDataSource.getRepository("Usuario");

    // Verify the nutricionista exists
    const usuario = await usuarioRepo.findOne({ where: { id: parseInt(nutricionistaId), estado: "activo" } });
    if (!usuario) {
        throw { status: 404, message: "Nutricionista no encontrado" };
    }

    // Validate hora_fin > hora_inicio
    if (hora_fin <= hora_inicio) {
        throw { status: 400, message: "La hora de fin debe ser posterior a la hora de inicio" };
    }

    // Check for overlapping disponibilidad for same user and day
    const existing = await repo.find({
        where: {
            usuario: { id: parseInt(nutricionistaId) },
            dia_semana,
            estado: "activo",
        },
    });

    for (const e of existing) {
        if (hora_inicio < e.hora_fin && hora_fin > e.hora_inicio) {
            throw { status: 409, message: `Ya existe un bloque de disponibilidad que se superpone (${e.hora_inicio} - ${e.hora_fin}) para el día ${dia_semana}` };
        }
    }

    const newDisp = repo.create({
        dia_semana,
        hora_inicio,
        hora_fin,
        duracion_minutos,
        estado: "activo",
        usuario,
    });
    const saved = await repo.save(newDisp);

    const full = await repo.findOne({
        where: { id_disponibilidad: saved.id_disponibilidad },
        relations: DISP_RELATIONS,
    });
    return formatDisponibilidad(full);
};

const updateDisponibilidadService = async (dispId, data) => {
    const repo = AppDataSource.getRepository("Disponibilidad");

    const disp = await repo.findOne({
        where: { id_disponibilidad: parseInt(dispId) },
        relations: DISP_RELATIONS,
    });

    if (!disp) {
        throw { status: 404, message: "Bloque de disponibilidad no encontrado" };
    }

    const dia_semana  = data.dia_semana  || disp.dia_semana;
    const hora_inicio = data.hora_inicio || disp.hora_inicio;
    const hora_fin    = data.hora_fin    || disp.hora_fin;

    if (hora_fin <= hora_inicio) {
        throw { status: 400, message: "La hora de fin debe ser posterior a la hora de inicio" };
    }

    // Check overlaps excluding self
    const existing = await repo.find({
        where: {
            usuario: { id: disp.usuario.id },
            dia_semana,
            estado: "activo",
        },
    });

    for (const e of existing) {
        if (e.id_disponibilidad === disp.id_disponibilidad) continue;
        if (hora_inicio < e.hora_fin && hora_fin > e.hora_inicio) {
            throw { status: 409, message: `Ya existe un bloque de disponibilidad que se superpone (${e.hora_inicio} - ${e.hora_fin}) para el día ${dia_semana}` };
        }
    }

    if (data.dia_semana       !== undefined) disp.dia_semana       = data.dia_semana;
    if (data.hora_inicio      !== undefined) disp.hora_inicio      = data.hora_inicio;
    if (data.hora_fin         !== undefined) disp.hora_fin         = data.hora_fin;
    if (data.duracion_minutos !== undefined) disp.duracion_minutos = data.duracion_minutos;

    await repo.save(disp);

    const updated = await repo.findOne({
        where: { id_disponibilidad: disp.id_disponibilidad },
        relations: DISP_RELATIONS,
    });
    return formatDisponibilidad(updated);
};

const deleteDisponibilidadService = async (dispId) => {
    const repo = AppDataSource.getRepository("Disponibilidad");

    const disp = await repo.findOne({
        where: { id_disponibilidad: parseInt(dispId) },
    });

    if (!disp) {
        throw { status: 404, message: "Bloque de disponibilidad no encontrado" };
    }

    // Soft delete
    disp.estado = "inactivo";
    await repo.save(disp);

    return { message: "Bloque de disponibilidad eliminado con éxito" };
};

module.exports = {
    getDisponibilidadService,
    createDisponibilidadService,
    updateDisponibilidadService,
    deleteDisponibilidadService,
};
