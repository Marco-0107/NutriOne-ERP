const { AppDataSource } = require("../config/configDb");
const { calcularDuracionMinutos, sumarMinutosAHora } = require("../utils/citaUtils");
const { generarCobro } = require("./cajaService");

const formatCita = (cita) => ({
    id_cita:             cita.id_cita,
    fecha:               cita.fecha,
    hora_inicio:         cita.hora_inicio,
    hora_fin:            cita.hora_fin,
    duracion_minutos:    calcularDuracionMinutos(cita.hora_inicio, cita.hora_fin),
    estado:              cita.estado,
    motivo_cancelacion:  cita.motivo_cancelacion ?? null,
    observacion:         cita.observacion ?? null,
    origen:              cita.origen,
    paciente: cita.paciente
        ? {
            id:               cita.paciente.id,
            nombres:          cita.paciente.usuario?.nombres          ?? "",
            apellido_paterno: cita.paciente.usuario?.apellido_paterno ?? "",
            apellido_materno: cita.paciente.usuario?.apellido_materno ?? "",
            fecha_nacimiento: cita.paciente.fecha_nacimiento          ?? null,
        }
        : null,
    nutricionista: cita.usuario
        ? {
            id:               cita.usuario.id,
            nombres:          cita.usuario.nombres,
            apellido_paterno: cita.usuario.apellido_paterno,
            apellido_materno: cita.usuario.apellido_materno,
        }
        : null,
    servicio: cita.servicio
        ? {
            id:               cita.servicio.id,
            nombre:           cita.servicio.nombre,
            duracion_minutos: cita.servicio.duracion_minutos,
            precio:           cita.servicio.precio,
            prevision:        cita.servicio.prevision,
        }
        : null,
    pago: cita.transacciones?.[0]
        ? {
            id_transaccion: cita.transacciones[0].id_transaccion,
            monto:          cita.transacciones[0].monto,
            estado_pago:    cita.transacciones[0].estado_pago,
        }
        : null,
    fecha_creacion:      cita.fecha_creacion,
    fecha_actualizacion: cita.fecha_actualizacion,
});

const getCitaConRelaciones = (citaId) =>
    AppDataSource.getRepository("Cita")
        .createQueryBuilder("cita")
        .leftJoinAndSelect("cita.paciente", "paciente")
        .leftJoinAndSelect("paciente.usuario", "pacienteUsuario")
        .leftJoinAndSelect("cita.usuario", "usuario")
        .leftJoinAndSelect("cita.servicio", "servicio")
        .leftJoinAndSelect("cita.transacciones", "transacciones")
        .where("cita.id_cita = :id", { id: citaId })
        .getOne();

// Checks time-range overlap — not just exact hora_inicio equality
const verificarSinConflicto = async (id_usuario, fecha, hora_inicio, hora_fin, excluirId = null) => {
    const qb = AppDataSource.getRepository("Cita")
        .createQueryBuilder("cita")
        .where("cita.usuario = :id_usuario", { id_usuario })
        .andWhere("cita.fecha = :fecha", { fecha })
        .andWhere("cita.estado != :cancelada", { cancelada: "cancelada" });

    if (excluirId) qb.andWhere("cita.id_cita != :excluirId", { excluirId });

    const existentes = await qb.getMany();

    const conflicto = existentes.some((c) => {
        const cInicio = c.hora_inicio.substring(0, 5);
        const cFin    = c.hora_fin.substring(0, 5);
        return hora_inicio < cFin && hora_fin > cInicio;
    });

    if (conflicto) {
        throw { status: 409, message: "El nutricionista ya tiene una cita agendada en ese horario" };
    }
};

const getCitasService = async (filtros = {}) => {
    const qb = AppDataSource.getRepository("Cita")
        .createQueryBuilder("cita")
        .leftJoinAndSelect("cita.paciente", "paciente")
        .leftJoinAndSelect("paciente.usuario", "pacienteUsuario")
        .leftJoinAndSelect("cita.usuario", "usuario")
        .leftJoinAndSelect("cita.servicio", "servicio")
        .leftJoinAndSelect("cita.transacciones", "transacciones");

    if (filtros.estado)      qb.andWhere("cita.estado = :estado",      { estado:      filtros.estado });
    if (filtros.id_usuario)  qb.andWhere("usuario.id = :id_usuario",   { id_usuario:  Number(filtros.id_usuario) });
    if (filtros.id_paciente) qb.andWhere("paciente.id = :id_paciente", { id_paciente: Number(filtros.id_paciente) });
    if (filtros.fecha)       qb.andWhere("cita.fecha = :fecha",        { fecha:       filtros.fecha });
    if (filtros.desde)       qb.andWhere("cita.fecha >= :desde",       { desde:       filtros.desde });
    if (filtros.hasta)       qb.andWhere("cita.fecha <= :hasta",       { hasta:       filtros.hasta });

    qb.orderBy("cita.fecha", "ASC").addOrderBy("cita.hora_inicio", "ASC");

    const citas = await qb.getMany();
    return citas.map(formatCita);
};

const getCitaByIdService = async (citaId) => {
    const cita = await getCitaConRelaciones(citaId);
    if (!cita) throw { status: 404, message: "Cita no encontrada" };
    return formatCita(cita);
};

const createCitaService = async ({ id_paciente, id_usuario, id_servicio, fecha, hora_inicio, hora_fin, observacion }) => {
    const paciente = await AppDataSource.getRepository("Paciente").findOneBy({ id: id_paciente });
    if (!paciente) throw { status: 404, message: "Paciente no encontrado" };

    const nutricionista = await AppDataSource.getRepository("Usuario").findOneBy({ id: id_usuario });
    if (!nutricionista) throw { status: 404, message: "Nutricionista no encontrado" };

    let servicio = null;
    if (id_servicio) {
        servicio = await AppDataSource.getRepository("Servicio").findOneBy({ id: id_servicio });
        if (!servicio) throw { status: 404, message: "Servicio no encontrado" };
        // La duración del servicio puede ser distinta a la del slot de disponibilidad: manda el servicio.
        hora_fin = sumarMinutosAHora(hora_inicio, servicio.duracion_minutos);
    }

    if (hora_fin <= hora_inicio) {
        throw { status: 400, message: "La hora de fin debe ser posterior a la hora de inicio" };
    }

    await verificarSinConflicto(id_usuario, fecha, hora_inicio, hora_fin);

    const citaData = {
        paciente,
        usuario:    nutricionista,
        fecha,
        hora_inicio,
        hora_fin,
        observacion: observacion ?? null,
        origen:      "interna",
        servicio:    servicio ?? undefined,
    };

    const citaRepo = AppDataSource.getRepository("Cita");
    const saved    = await citaRepo.save(citaRepo.create(citaData));

    // El cobro se genera al marcar la cita como 'realizada' (ver updateCitaService).

    return formatCita(await getCitaConRelaciones(saved.id_cita));
};

const updateCitaService = async (citaId, datos) => {
    const { id_paciente, id_usuario, id_servicio, fecha, hora_inicio, hora_fin, estado, motivo_cancelacion, observacion } = datos;

    const cita = await getCitaConRelaciones(citaId);
    if (!cita) throw { status: 404, message: "Cita no encontrada" };
    if (cita.estado === "cancelada") throw { status: 400, message: "No se puede modificar una cita cancelada" };

    const estadoOriginal = cita.estado;

    if (id_paciente !== undefined) {
        const paciente = await AppDataSource.getRepository("Paciente").findOneBy({ id: id_paciente });
        if (!paciente) throw { status: 404, message: "Paciente no encontrado" };
        cita.paciente = paciente;
    }

    if (id_usuario !== undefined) {
        const nutricionista = await AppDataSource.getRepository("Usuario").findOneBy({ id: id_usuario });
        if (!nutricionista) throw { status: 404, message: "Nutricionista no encontrado" };
        cita.usuario = nutricionista;
    }

    let servicio;
    if (id_servicio !== undefined) {
        if (id_servicio === null) {
            cita.servicio = null;
        } else {
            servicio = await AppDataSource.getRepository("Servicio").findOneBy({ id: id_servicio });
            if (!servicio) throw { status: 404, message: "Servicio no encontrado" };
            cita.servicio = servicio;
        }
    }

    if (fecha              !== undefined) cita.fecha              = fecha;
    if (hora_inicio        !== undefined) cita.hora_inicio        = hora_inicio;
    if (hora_fin           !== undefined) cita.hora_fin           = hora_fin;
    if (estado             !== undefined) cita.estado             = estado;
    if (motivo_cancelacion !== undefined) cita.motivo_cancelacion = motivo_cancelacion;
    if (observacion        !== undefined) cita.observacion        = observacion;

    // La duración del servicio puede ser distinta a la del slot: manda el servicio si se asignó/cambió uno.
    if (servicio) {
        cita.hora_fin = sumarMinutosAHora(cita.hora_inicio.substring(0, 5), servicio.duracion_minutos);
    }

    const hi = cita.hora_inicio.substring(0, 5);
    const hf = cita.hora_fin.substring(0, 5);
    if (hf <= hi) throw { status: 400, message: "La hora de fin debe ser posterior a la hora de inicio" };

    if (fecha !== undefined || hora_inicio !== undefined || hora_fin !== undefined || id_usuario !== undefined || servicio) {
        await verificarSinConflicto(cita.usuario.id, cita.fecha, hi, hf, citaId);
    }

    const marcandoCompletada = estado === "completada" && estadoOriginal !== "completada";

    if (marcandoCompletada) {
        // Atómico: la cita pasa a 'completada' y se genera el cobro en la misma transacción.
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            await queryRunner.manager.save("Cita", cita);
            await generarCobro(citaId, queryRunner);
            await queryRunner.commitTransaction();
        } catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        } finally {
            await queryRunner.release();
        }
    } else {
        await AppDataSource.getRepository("Cita").save(cita);
    }

    return formatCita(await getCitaConRelaciones(citaId));
};

const cancelarCitaService = async (citaId, motivo_cancelacion) => {
    const cita = await getCitaConRelaciones(citaId);
    if (!cita) throw { status: 404, message: "Cita no encontrada" };
    if (cita.estado === "cancelada") throw { status: 400, message: "La cita ya se encuentra cancelada" };

    cita.estado = "cancelada";
    if (motivo_cancelacion) cita.motivo_cancelacion = motivo_cancelacion;

    const updated = await AppDataSource.getRepository("Cita").save(cita);
    return formatCita(updated);
};

module.exports = { getCitasService, getCitaByIdService, createCitaService, updateCitaService, cancelarCitaService };
