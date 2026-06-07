const { AppDataSource } = require("../config/configDb");
const { Between, Not, In } = require("typeorm");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

/**
 * Get all active nutricionistas.
 */
const getNutricionistasPublicoService = async () => {
    const usuarioRolRepo = AppDataSource.getRepository("UsuarioRol");
    
    // Find all active UsuarioRol entries where the role is 'Nutricionista'
    const usuarioRoles = await usuarioRolRepo.find({
        where: {
            estado: "activo",
            role: { nombre: "Nutricionista", estado: "activo" },
        },
        relations: { usuario: true, role: true },
    });

    const seen = new Set();
    const nutricionistas = [];
    for (const ur of usuarioRoles) {
        if (ur.usuario && ur.usuario.estado === "activo" && !seen.has(ur.usuario.id)) {
            seen.add(ur.usuario.id);
            nutricionistas.push({
                id: ur.usuario.id,
                nombres: ur.usuario.nombres,
                apellido_paterno: ur.usuario.apellido_paterno,
                apellido_materno: ur.usuario.apellido_materno,
            });
        }
    }

    return nutricionistas;
};

/**
 * Get available slots of 30 mins for a given nutricionista and date.
 */
const getDisponibilidadPublicaService = async (nutricionistaId, fecha) => {
    const dias = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    const parts = fecha.split('-');
    const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
    const diaSemana = dias[dateObj.getDay()];

    const DIAS_VALIDOS = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];
    if (!DIAS_VALIDOS.includes(diaSemana)) {
        return [];
    }

    const disponibilidadRepo = AppDataSource.getRepository("Disponibilidad");
    const disponibilidades = await disponibilidadRepo.find({
        where: {
            usuario: { id: parseInt(nutricionistaId) },
            dia_semana: diaSemana,
            estado: "activo",
        },
    });

    if (disponibilidades.length === 0) {
        return [];
    }

    const citaRepo = AppDataSource.getRepository("Cita");
    const citas = await citaRepo.find({
        where: {
            usuario: { id: parseInt(nutricionistaId) },
            fecha,
            estado: Not("cancelada"),
        },
    });

    // Generate slots of 30 minutes
    const generateSlots = (horaInicio, horaFin, duracionMinutos = 30) => {
        const slots = [];
        let [h, m] = horaInicio.split(':').map(Number);
        const [endH, endM] = horaFin.split(':').map(Number);
        
        while (h * 60 + m + duracionMinutos <= endH * 60 + endM) {
            const slotStart = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
            m += duracionMinutos;
            if (m >= 60) { h += Math.floor(m / 60); m = m % 60; }
            const slotEnd = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
            slots.push({ hora_inicio: slotStart, hora_fin: slotEnd });
        }
        return slots;
    };

    let allSlots = [];
    for (const d of disponibilidades) {
        const slots = generateSlots(d.hora_inicio, d.hora_fin, d.duracion_minutos || 30);
        allSlots = allSlots.concat(slots);
    }

    // Filter occupied slots
    const isOcupado = (slot, existingCitas) => {
        return existingCitas.some(cita => {
            const citaInicio = cita.hora_inicio.substring(0, 5);
            const citaFin = cita.hora_fin.substring(0, 5);
            return slot.hora_inicio < citaFin && slot.hora_fin > citaInicio;
        });
    };

    return allSlots.filter(slot => !isOcupado(slot, citas));
};

const mapCitaPublica = (cita) => ({
    id_cita: cita.id_cita,
    fecha: cita.fecha,
    hora_inicio: cita.hora_inicio,
    hora_fin: cita.hora_fin,
    estado: cita.estado,
    origen: cita.origen,
    observacion: cita.observacion,
    paciente: cita.paciente
        ? {
            id: cita.paciente.id,
            nombres: cita.paciente.usuario?.nombres || "",
            apellido_paterno: cita.paciente.usuario?.apellido_paterno || "",
            apellido_materno: cita.paciente.usuario?.apellido_materno || "",
        }
        : null,
    usuario: cita.usuario
        ? {
            id: cita.usuario.id,
            nombres: cita.usuario.nombres,
            apellido_paterno: cita.usuario.apellido_paterno,
            apellido_materno: cita.usuario.apellido_materno,
        }
        : null,
    servicio: cita.servicio
        ? {
            id: cita.servicio.id,
            nombre: cita.servicio.nombre,
            descripcion: cita.servicio.descripcion,
            duracion_minutos: cita.servicio.duracion_minutos,
        }
        : null,
});

const formatLocalDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const parseDateOrThrow = (value, label) => {
    if (!value) return null;

    const parsed = new Date(`${value}T12:00:00`);
    if (Number.isNaN(parsed.getTime())) {
        throw { status: 400, message: `${label} debe tener formato YYYY-MM-DD` };
    }

    return formatLocalDate(parsed);
};

const getCurrentWeekRange = () => {
    const today = new Date();
    const currentDay = today.getDay();
    const diff = currentDay === 0 ? -6 : 1 - currentDay;

    const start = new Date(today);
    start.setDate(today.getDate() + diff);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return {
        desde: formatLocalDate(start),
        hasta: formatLocalDate(end),
    };
};

const getCitasPublicasCalendarioService = async ({ desde, hasta } = {}) => {
    const range = desde && hasta
        ? {
            desde: parseDateOrThrow(desde, "La fecha inicial"),
            hasta: parseDateOrThrow(hasta, "La fecha final"),
        }
        : getCurrentWeekRange();

    if (new Date(`${range.desde}T12:00:00`) > new Date(`${range.hasta}T12:00:00`)) {
        throw { status: 400, message: "La fecha inicial no puede ser mayor que la fecha final" };
    }

    const citaRepo = AppDataSource.getRepository("Cita");

    const citas = await citaRepo.find({
        where: {
            fecha: Between(range.desde, range.hasta),
            origen: "publica",
        },
        relations: {
            paciente: {
                usuario: true,
            },
            usuario: true,
            servicio: true,
        },
        order: {
            fecha: "ASC",
            hora_inicio: "ASC",
        },
    });

    return {
        rango: range,
        total: citas.length,
        citas: citas.map(mapCitaPublica),
    };
};

/**
 * Creates/Finds patient and creates appointment in one transaction.
 */
const agendarCitaPublicaService = async (data) => {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
        const usuarioRepo = queryRunner.manager.getRepository("Usuario");
        const pacienteRepo = queryRunner.manager.getRepository("Paciente");
        const citaRepo = queryRunner.manager.getRepository("Cita");

        // 1. Look for existing patient by RUT
        let usuarioPaciente = await usuarioRepo.findOne({ where: { rut: data.rut } });
        let paciente;

        if (usuarioPaciente) {
            paciente = await pacienteRepo.findOne({
                where: { usuario: { id: usuarioPaciente.id } },
                relations: { usuario: true },
            });
            
            if (!paciente) {
                paciente = pacienteRepo.create({
                    fecha_nacimiento: data.fecha_nacimiento,
                    usuario: usuarioPaciente,
                });
                paciente = await pacienteRepo.save(paciente);
            }
        } else {
            const rutBase        = data.rut.replace(/[^0-9kK]/gi, '').toLowerCase();
            const correoInterno  = `pac.${rutBase}@nutrione.internal`;
            const passInterno    = crypto.randomBytes(32).toString("hex");
            const salt           = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(passInterno, salt);

            const newUsuario = usuarioRepo.create({
                rut: data.rut,
                nombres: data.nombres,
                apellido_paterno: data.apellido_paterno,
                apellido_materno: data.apellido_materno,
                correo: correoInterno,
                contrasena: hashedPassword,
                estado: "activo",
            });
            const savedUsuario = await usuarioRepo.save(newUsuario);

            paciente = pacienteRepo.create({
                fecha_nacimiento: data.fecha_nacimiento,
                usuario: savedUsuario,
            });
            paciente = await pacienteRepo.save(paciente);
        }

        // 2. Validate the nutricionista
        const nutricionista = await usuarioRepo.findOne({
            where: { id: parseInt(data.id_usuario), estado: "activo" }
        });
        if (!nutricionista) {
            throw { status: 404, message: "Nutricionista no encontrado o inactivo" };
        }

        // 3. Check conflict
        const conflictingCitas = await citaRepo.find({
            where: {
                usuario: { id: nutricionista.id },
                fecha: data.fecha,
                estado: Not("cancelada"),
            },
        });

        const hasConflict = conflictingCitas.some(cita => {
            const citaInicio = cita.hora_inicio.substring(0, 5);
            const citaFin = cita.hora_fin.substring(0, 5);
            const reqInicio = data.hora_inicio.substring(0, 5);
            const reqFin = data.hora_fin.substring(0, 5);
            return reqInicio < citaFin && reqFin > citaInicio;
        });

        if (hasConflict) {
            throw { status: 409, message: "El horario seleccionado ya no está disponible" };
        }

        // 4. Save Cita
        const newCita = citaRepo.create({
            fecha: data.fecha,
            hora_inicio: data.hora_inicio,
            hora_fin: data.hora_fin,
            observacion: data.observacion || null,
            estado: "pendiente",
            origen: "publica",
            paciente: paciente,
            usuario: nutricionista,
        });

        const savedCita = await citaRepo.save(newCita);
        await queryRunner.commitTransaction();

        return {
            id_cita: savedCita.id_cita,
            fecha: savedCita.fecha,
            hora_inicio: savedCita.hora_inicio,
            hora_fin: savedCita.hora_fin,
            estado: savedCita.estado,
            origen: savedCita.origen,
            paciente: {
                id: paciente.id,
                nombres: paciente.usuario.nombres,
                apellido_paterno: paciente.usuario.apellido_paterno,
                apellido_materno: paciente.usuario.apellido_materno,
            },
            nutricionista: {
                id: nutricionista.id,
                nombres: `${nutricionista.nombres} ${nutricionista.apellido_paterno}`,
            },
        };

    } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
    } finally {
        await queryRunner.release();
    }
};

module.exports = {
    getNutricionistasPublicoService,
    getDisponibilidadPublicaService,
    agendarCitaPublicaService,
    getCitasPublicasCalendarioService,
};
