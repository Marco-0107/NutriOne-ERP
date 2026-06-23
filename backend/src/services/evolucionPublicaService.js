const { AppDataSource } = require("../config/configDb");

const onlyDigits = (value) => (value || "").replace(/\D/g, "");

/**
 * Compares two phone numbers leniently: exact digit match, or matching
 * by the last 9 digits (covers +56 country code differences).
 */
const telefonosCoinciden = (a, b) => {
    const da = onlyDigits(a);
    const db = onlyDigits(b);
    if (!da || !db) return false;
    if (da === db) return true;
    return da.slice(-9) === db.slice(-9);
};

const buscarPacientePorRut = async (rut) => {
    const pacienteRepo = AppDataSource.getRepository("Paciente");
    return pacienteRepo.findOne({
        where: { usuario: { rut } },
        relations: { usuario: true },
    });
};

/**
 * Validates that the given RUT exists and the phone matches the one on file.
 * Throws a descriptive error otherwise (per requirement: explicitly tell the
 * user when the phone does not match, instead of a generic message).
 */
const validarRutYTelefonoService = async (rut, telefono) => {
    const paciente = await buscarPacientePorRut(rut);
    if (!paciente) {
        throw { status: 404, message: "No se encontró un paciente registrado con ese RUT" };
    }

    if (!paciente.telefono) {
        throw { status: 400, message: "Este paciente no tiene un teléfono registrado. Contacta a tu nutricionista para actualizarlo" };
    }

    if (!telefonosCoinciden(paciente.telefono, telefono)) {
        throw { status: 400, message: "El teléfono ingresado no coincide con el registrado para este RUT" };
    }

    return paciente;
};

const formatPacientePublico = (paciente) => ({
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

// Solo expone los campos que EvolucionDashboard.jsx efectivamente usa para
// renderizar — nunca la entidad cruda (esto es un endpoint público sin auth,
// así que no debe filtrar contraseñas, teléfonos u otros datos sensibles).
const formatFichaPublica = (ficha) => ({
    id_ficha:                ficha.id_ficha,
    tipo:                    ficha.tipo,
    fecha_atencion:          ficha.fecha_atencion,
    edad:                    ficha.edad,
    sexo:                    ficha.sexo,
    peso:                    ficha.peso,
    talla:                   ficha.talla,
    presion_arterial:        ficha.presion_arterial,
    circunferencia_cintura:  ficha.circunferencia_cintura,
    calculos:                ficha.calculos,
    diagnostico_nutricional: ficha.diagnostico_nutricional,
    motivo_consulta:         ficha.motivo_consulta,
    observacion:             ficha.observacion,
    indicaciones:            ficha.indicaciones,
    recomendaciones:         ficha.recomendaciones,
    derivaciones:            ficha.derivaciones,
    estado:                  ficha.estado,
    cita: ficha.cita?.usuario
        ? {
            usuario: {
                nombres:          ficha.cita.usuario.nombres,
                apellido_paterno: ficha.cita.usuario.apellido_paterno,
                apellido_materno: ficha.cita.usuario.apellido_materno,
            },
        }
        : null,
});

/**
 * Returns the same read-only evolution data the nutricionista sees
 * (paciente info + fichas clínicas ordered by fecha_atencion ASC).
 */
const getEvolucionPublicaService = async (rut, telefono) => {
    const paciente = await validarRutYTelefonoService(rut, telefono);

    const fichas = await AppDataSource.getRepository("FichaClinica")
        .createQueryBuilder("ficha")
        .leftJoinAndSelect("ficha.cita", "cita")
        .leftJoinAndSelect("cita.paciente", "paciente")
        .leftJoinAndSelect("cita.usuario", "nutricionista")
        .where("paciente.id = :id_paciente", { id_paciente: paciente.id })
        .orderBy("ficha.fecha_atencion", "ASC")
        .getMany();

    return {
        paciente: formatPacientePublico(paciente),
        fichas: fichas.map(formatFichaPublica),
    };
};

module.exports = { validarRutYTelefonoService, getEvolucionPublicaService };
