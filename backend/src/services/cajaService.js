"use strict";
const { AppDataSource } = require("../config/configDb");

const formatPago = (pago) => ({
    id_transaccion: pago.id_transaccion,
    monto:          Number(pago.monto),
    metodo_pago:    pago.metodo_pago,
    notas:          pago.notas ?? null,
    fecha_pago:     pago.fecha_pago,
});

const formatCobro = (cobro) => {
    const montoTotal  = Number(cobro.monto_total);
    const montoPagado = Number(cobro.monto_pagado);
    return {
        id_cobro:            cobro.id_cobro,
        monto_total:         montoTotal,
        monto_pagado:        montoPagado,
        saldo_pendiente:     parseFloat((montoTotal - montoPagado).toFixed(2)),
        estado:              cobro.estado,
        notas:               cobro.notas ?? null,
        fecha_creacion:      cobro.fecha_creacion,
        fecha_actualizacion: cobro.fecha_actualizacion,
        cita: cobro.cita
            ? { id_cita: cobro.cita.id_cita, fecha: cobro.cita.fecha }
            : null,
        pagos: Array.isArray(cobro.pagos)
            ? cobro.pagos.map(formatPago)
            : [],
    };
};

// Crea el cobro para una cita completada. Idempotente: si ya existe, lo retorna.
// Acepta un QueryRunner externo para participar en transacciones compuestas.
// Cuando se pasa externalQR, se omite la validación de estado (el caller la garantiza).
const generarCobro = async (citaId, externalQR = null) => {
    const manager = externalQR ? externalQR.manager : AppDataSource.manager;

    const cita = await manager.findOne("Cita", {
        where: { id_cita: citaId },
        relations: { servicio: true },
    });
    if (!cita) throw { status: 404, message: "Cita no encontrada" };

    // Validar estado solo en llamadas manuales (sin transacción externa)
    if (!externalQR && cita.estado !== "completada") {
        throw { status: 400, message: "Solo se puede generar un cobro para citas en estado 'completada'" };
    }
    if (!cita.servicio || cita.servicio.precio == null) {
        throw { status: 400, message: "La cita no tiene un servicio con precio definido" };
    }

    // Si ya existe un cobro, retornarlo sin crear otro
    const existente = await manager.findOne("Cobro", {
        where: { cita: { id_cita: citaId } },
        relations: { cita: true, pagos: true },
    });
    if (existente) return formatCobro(existente);

    const montoTotal = Number(cita.servicio.precio);

    const cobroRepo = manager.getRepository("Cobro");
    const nuevo = cobroRepo.create({
        monto_total:  montoTotal,
        monto_pagado: 0,
        estado:       "pendiente",
        cita:         { id_cita: citaId },
    });
    const saved = await cobroRepo.save(nuevo);

    return formatCobro({ ...saved, cita, pagos: [] });
};


// Registra un pago o abono sobre un cobro.
// Usa FOR UPDATE para evitar descuadres si llegan dos pagos al mismo tiempo.
const registrarPago = async (cobroId, { monto, metodo_pago, notas }) => {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
        const cobros = await queryRunner.manager.query(
            `SELECT * FROM cobros WHERE id_cobro = $1 FOR UPDATE`,
            [cobroId]
        );
        if (!cobros.length) throw { status: 404, message: "Cobro no encontrado" };

        const cobro       = cobros[0];
        const montoTotal  = Number(cobro.monto_total);
        const montoPagado = Number(cobro.monto_pagado);
        const saldo       = parseFloat((montoTotal - montoPagado).toFixed(2));

        if (cobro.estado === "anulado") {
            throw { status: 400, message: "No se puede registrar un pago sobre un cobro anulado" };
        }
        if (cobro.estado === "pagado") {
            throw { status: 400, message: "El cobro ya está completamente pagado" };
        }

        const montoNormalizado = parseFloat(Number(monto).toFixed(2));
        if (montoNormalizado <= 0) {
            throw { status: 422, message: "El monto del pago debe ser mayor a cero" };
        }
        if (montoNormalizado > saldo) {
            throw {
                status: 422,
                message: `El monto ($${montoNormalizado}) supera el saldo pendiente ($${saldo})`,
            };
        }

        await queryRunner.manager.query(
            `INSERT INTO transacciones (monto, metodo_pago, estado_pago, fecha_pago, id_cita, id_cobro, notas)
             VALUES ($1, $2, 'pagado', now(), $3, $4, $5)`,
            [montoNormalizado, metodo_pago, cobro.id_cita, cobroId, notas ?? null]
        );

        const nuevoMontoPagado = parseFloat((montoPagado + montoNormalizado).toFixed(2));
        const nuevoEstado = nuevoMontoPagado >= montoTotal ? "pagado" : "pagado_parcial";

        await queryRunner.manager.query(
            `UPDATE cobros
             SET monto_pagado = $1, estado = $2, fecha_actualizacion = now()
             WHERE id_cobro = $3`,
            [nuevoMontoPagado, nuevoEstado, cobroId]
        );

        await queryRunner.commitTransaction();
        return getCobro(cobroId);
    } catch (err) {
        await queryRunner.rollbackTransaction();
        throw err;
    } finally {
        await queryRunner.release();
    }
};

// Retorna el detalle de un cobro con sus pagos.
const getCobro = async (cobroId) => {
    const cobro = await AppDataSource.getRepository("Cobro").findOne({
        where: { id_cobro: cobroId },
        relations: { cita: true, pagos: true },
        order: { pagos: { fecha_pago: "ASC" } },
    });
    if (!cobro) throw { status: 404, message: "Cobro no encontrado" };
    return formatCobro(cobro);
};

// Lista todos los cobros del sistema con cita, paciente, servicio y pagos.
// Si se pasa nutricionistaId, filtra solo los cobros de las citas de ese nutricionista.
const getCobros = async ({ nutricionistaId } = {}) => {
    const qb = AppDataSource.getRepository("Cobro")
        .createQueryBuilder("cobro")
        .innerJoinAndSelect("cobro.cita", "cita")
        .innerJoinAndSelect("cita.paciente", "paciente")
        .innerJoinAndSelect("paciente.usuario", "pacienteUsuario")
        .innerJoinAndSelect("cita.usuario", "nutricionista")
        .leftJoinAndSelect("cita.servicio", "servicio")
        .leftJoinAndSelect("cobro.pagos", "pagos")
        .orderBy("cobro.fecha_creacion", "DESC");

    if (nutricionistaId) {
        qb.where("nutricionista.id = :nutricionistaId", { nutricionistaId: Number(nutricionistaId) });
    }

    const cobros = await qb.getMany();

    return cobros.map((c) => ({
        ...formatCobro(c),
        servicio:   c.cita?.servicio  ? { id: c.cita.servicio.id, nombre: c.cita.servicio.nombre } : null,
        fecha_cita: c.cita?.fecha ?? null,
        paciente:   c.cita?.paciente  ? {
            id:               c.cita.paciente.id,
            nombres:          c.cita.paciente.usuario?.nombres          ?? "",
            apellido_paterno: c.cita.paciente.usuario?.apellido_paterno ?? "",
        } : null,
    }));
};

// Retorna todos los cobros de un paciente y su deuda total acumulada.
const getResumenPaciente = async (pacienteId) => {
    const cobros = await AppDataSource.getRepository("Cobro")
        .createQueryBuilder("cobro")
        .innerJoinAndSelect("cobro.cita", "cita")
        .innerJoinAndSelect("cita.paciente", "paciente")
        .leftJoinAndSelect("cita.servicio", "servicio")
        .leftJoinAndSelect("cobro.pagos", "pagos")
        .where("paciente.id = :pacienteId", { pacienteId })
        .orderBy("cita.fecha", "DESC")
        .getMany();

    const items = cobros.map((c) => ({
        ...formatCobro(c),
        servicio: c.cita?.servicio
            ? { id: c.cita.servicio.id, nombre: c.cita.servicio.nombre }
            : null,
        fecha_cita: c.cita?.fecha ?? null,
    }));

    const totalDeuda = items.reduce((acc, c) => acc + c.saldo_pendiente, 0);

    return {
        paciente_id: pacienteId,
        total_deuda: parseFloat(totalDeuda.toFixed(2)),
        cobros:      items,
    };
};

// Lista los pagos registrados en un rango de fechas con subtotales por método de pago.
const getMovimientosCaja = async ({ desde, hasta, nutricionistaId } = {}) => {
    const qb = AppDataSource.getRepository("Transaccion")
        .createQueryBuilder("pago")
        .innerJoinAndSelect("pago.cobro", "cobro")
        .innerJoinAndSelect("cobro.cita", "cita")
        .innerJoinAndSelect("cita.paciente", "paciente")
        .innerJoinAndSelect("paciente.usuario", "pacienteUsuario")
        .leftJoinAndSelect("cita.servicio", "servicio")
        .innerJoinAndSelect("cita.usuario", "nutricionista")
        .where("pago.id_cobro IS NOT NULL");

    if (desde)          qb.andWhere("pago.fecha_pago::date >= :desde", { desde });
    if (hasta)          qb.andWhere("pago.fecha_pago::date <= :hasta", { hasta });
    if (nutricionistaId) qb.andWhere("nutricionista.id = :nutricionistaId", { nutricionistaId: Number(nutricionistaId) });

    qb.orderBy("pago.fecha_pago", "DESC");

    const pagos = await qb.getMany();

    const subtotales = {};
    let totalGeneral = 0;
    for (const p of pagos) {
        const metodo = p.metodo_pago;
        const monto  = Number(p.monto);
        subtotales[metodo] = parseFloat(((subtotales[metodo] || 0) + monto).toFixed(2));
        totalGeneral += monto;
    }

    return {
        total_ingresos:        parseFloat(totalGeneral.toFixed(2)),
        subtotales_por_metodo: subtotales,
        movimientos: pagos.map((p) => ({
            id_transaccion: p.id_transaccion,
            monto:          Number(p.monto),
            metodo_pago:    p.metodo_pago,
            notas:          p.notas ?? null,
            fecha_pago:     p.fecha_pago,
            cobro: {
                id_cobro:    p.cobro?.id_cobro,
                monto_total: Number(p.cobro?.monto_total),
                estado:      p.cobro?.estado,
            },
            paciente: p.cobro?.cita?.paciente
                ? {
                    id:               p.cobro.cita.paciente.id,
                    nombres:          p.cobro.cita.paciente.usuario?.nombres ?? "",
                    apellido_paterno: p.cobro.cita.paciente.usuario?.apellido_paterno ?? "",
                }
                : null,
            servicio: p.cobro?.cita?.servicio
                ? { id: p.cobro.cita.servicio.id, nombre: p.cobro.cita.servicio.nombre }
                : null,
        })),
    };
};

// Anula un cobro pendiente o parcialmente pagado.
// Los pagos previos se conservan como historial.
const anularCobro = async (cobroId) => {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
        const cobros = await queryRunner.manager.query(
            `SELECT * FROM cobros WHERE id_cobro = $1 FOR UPDATE`,
            [cobroId]
        );
        if (!cobros.length) throw { status: 404, message: "Cobro no encontrado" };

        const cobro = cobros[0];
        if (cobro.estado === "pagado") {
            throw { status: 400, message: "No se puede anular un cobro que ya está completamente pagado" };
        }
        if (cobro.estado === "anulado") {
            throw { status: 400, message: "El cobro ya se encuentra anulado" };
        }

        await queryRunner.manager.query(
            `UPDATE cobros SET estado = 'anulado', fecha_actualizacion = now() WHERE id_cobro = $1`,
            [cobroId]
        );

        await queryRunner.commitTransaction();
        return { message: "Cobro anulado exitosamente", id_cobro: cobroId };
    } catch (err) {
        await queryRunner.rollbackTransaction();
        throw err;
    } finally {
        await queryRunner.release();
    }
};

// Retorna el resumen de ingresos del mes en curso, agrupado por método de pago.
const getResumenCaja = async ({ nutricionistaId } = {}) => {
    const now    = new Date();
    const anio   = now.getFullYear();
    const mes    = String(now.getMonth() + 1).padStart(2, '0');
    const desde  = `${anio}-${mes}-01`;
    // Último día del mes actual
    const ultimoDia = new Date(anio, now.getMonth() + 1, 0).getDate();
    const hasta  = `${anio}-${mes}-${String(ultimoDia).padStart(2, '0')}`;

    const qb = AppDataSource.getRepository("Transaccion")
        .createQueryBuilder("pago")
        .innerJoin("pago.cobro", "cobro")
        .innerJoin("cobro.cita", "cita")
        .innerJoin("cita.usuario", "nutricionista")
        .where("pago.id_cobro IS NOT NULL")
        .andWhere("pago.fecha_pago::date >= :desde", { desde })
        .andWhere("pago.fecha_pago::date <= :hasta", { hasta });

    if (nutricionistaId) {
        qb.andWhere("nutricionista.id = :nutricionistaId", { nutricionistaId: Number(nutricionistaId) });
    }

    const pagos = await qb
        .select(["pago.monto", "pago.metodo_pago"])
        .getMany();

    const porMetodo = {};
    let totalEnCaja = 0;
    for (const p of pagos) {
        const metodo = p.metodo_pago;
        const monto  = Number(p.monto);
        porMetodo[metodo] = parseFloat(((porMetodo[metodo] || 0) + monto).toFixed(2));
        totalEnCaja += monto;
    }

    return {
        periodo:      `${mes}/${anio}`,
        total_en_caja: parseFloat(totalEnCaja.toFixed(2)),
        por_metodo:   porMetodo,
    };
};

module.exports = {
    generarCobro,
    registrarPago,
    getCobro,
    getCobros,
    getResumenPaciente,
    getMovimientosCaja,
    getResumenCaja,
    anularCobro,
};
