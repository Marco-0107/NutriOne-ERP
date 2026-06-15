const { AppDataSource } = require("../config/configDb");
const { badRequest, serverError, notFound, conflict } = require("../handlers/errorHandler");
const { evaluacionSchema } = require("../validations/calculoValidations");
const { evaluarPaciente } = require("../utils/evaluacionNutricional");
const { FACTOR_PATOLOGIA } = require("../utils/referencias/factorPatologia");

/** Valida el body con Joi y devuelve [value, errorMsg]. */
function validar(body) {
    const { error, value } = evaluacionSchema.validate(body, { abortEarly: false });
    if (error) {
        const msg = [...new Set(error.details.map((d) => d.message))].join(". ");
        return [null, msg];
    }
    return [value, null];
}

/** Aplana el resultado de evaluarPaciente() + inputs en columnas de la entidad. */
function construirRegistro(value, ev) {
    const p = value.perimetros || {};
    const pl = value.pliegues || {};
    const a = ev.antropometria;
    const d = a.grasa || {};
    const macros = ev.macros.distribucion || {};

    return {
        etapa_ciclo_vital: ev.etapa.etapa,

        // mediciones
        peso_actual:   value.pesoActual ?? null,
        peso_habitual: value.pesoHabitual ?? null,
        talla:         value.tallaCm ?? null,
        perimetro_muneca:      p.muneca ?? null,
        perimetro_cintura:     p.cintura ?? null,
        perimetro_cadera:      p.cadera ?? null,
        perimetro_cuello:      p.cuello ?? null,
        perimetro_pantorrilla: p.pantorrilla ?? null,
        perimetro_braquial:    p.braquial ?? null,
        perimetro_cefalico:    p.cefalico ?? null,
        pliegue_tricipital:    pl.tricipital ?? null,
        pliegue_bicipital:     pl.bicipital ?? null,
        pliegue_subescapular:  pl.subescapular ?? null,
        pliegue_cresta_iliaca: pl.crestaIliaca ?? null,
        pliegue_supraespinal:  pl.supraespinal ?? null,
        pliegue_abdominal:     pl.abdominal ?? null,

        // resultados antropométricos
        imc:               a.imc.valor,
        clasificacion_imc: a.imc.clasificacion,
        peso_ideal:  a.pesos.ideal,
        peso_minimo: a.pesos.minimo,
        peso_maximo: a.pesos.maximo,
        peso_meta:   a.pesos.meta,
        porcentaje_perdida_peso: a.perdidaPeso.valor,
        contextura:                a.contextura.clasificacion,
        clasificacion_cuello:      a.cuello.clasificacion,
        clasificacion_cintura:     a.cintura.clasificacion,
        clasificacion_pantorrilla: a.pantorrilla.clasificacion,
        icc: a.icc.valor,
        clasificacion_icc: a.icc.clasificacion,
        ica: a.ica.valor,
        clasificacion_ica: a.ica.clasificacion,
        cmb: a.reservas.cmb,
        amb: a.reservas.amb,
        agb: a.reservas.agb,
        porcentaje_grasa:    d.valor ?? null,
        clasificacion_grasa: d.clasificacion ?? null,
        metodo_grasa:        d.metodo ?? null,

        // energético
        nivel_actividad:  ev.energetico.actividadCategoria,
        pal:              ev.energetico.pal,
        es_hospitalizado: ev.energetico.hospitalizado,
        patologia:        ev.energetico.patologia,
        fp:               ev.energetico.fp,
        geb:              ev.energetico.geb,
        get:              ev.energetico.get,

        // macros
        pro_porcentaje: macros.pro?.pct ?? null,
        pro_gramos:     macros.pro?.gramos ?? null,
        cho_porcentaje: macros.cho?.pct ?? null,
        cho_gramos:     macros.cho?.gramos ?? null,
        lip_porcentaje: macros.lip?.pct ?? null,
        lip_gramos:     macros.lip?.gramos ?? null,

        diagnostico_generado: ev.diagnostico,
    };
}

/**
 * POST /calculos/preview
 * Calcula la evaluación completa SIN guardar (cálculo en vivo).
 */
const previewCalculo = async (req, res) => {
    const [value, err] = validar(req.body);
    if (err) return badRequest(res, err);
    try {
        const ev = evaluarPaciente(value);
        return res.json({ success: true, data: ev });
    } catch (e) {
        return serverError(res, e, "calculoController.previewCalculo");
    }
};

/**
 * POST /calculos/ficha/:id_ficha
 * Crea la evaluación nutricional de una ficha. 409 si ya existe (usar PUT).
 */
const crearEvaluacion = async (req, res) => {
    const id_ficha = parseInt(req.params.id_ficha);
    if (isNaN(id_ficha)) return badRequest(res, "El ID de la ficha debe ser un número válido.");

    const [value, err] = validar(req.body);
    if (err) return badRequest(res, err);

    try {
        const ficha = await AppDataSource.getRepository("FichaClinica").findOneBy({ id_ficha });
        if (!ficha) return notFound(res, "Ficha clínica");

        const repo = AppDataSource.getRepository("EvaluacionNutricional");
        const existente = await repo.findOne({ where: { ficha: { id_ficha } } });
        if (existente) {
            return conflict(res, "Esta ficha ya tiene una evaluación nutricional. Use actualizar (PUT).");
        }

        const ev = evaluarPaciente(value);
        const registro = repo.create({ ...construirRegistro(value, ev), ficha });
        const saved = await repo.save(registro);

        return res.status(201).json({ success: true, data: saved, evaluacion: ev });
    } catch (e) {
        return serverError(res, e, "calculoController.crearEvaluacion");
    }
};

/**
 * PUT /calculos/:id
 * Actualiza una evaluación nutricional existente.
 */
const actualizarEvaluacion = async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return badRequest(res, "El ID de la evaluación debe ser un número válido.");

    const [value, err] = validar(req.body);
    if (err) return badRequest(res, err);

    try {
        const repo = AppDataSource.getRepository("EvaluacionNutricional");
        const evaluacion = await repo.findOneBy({ id });
        if (!evaluacion) return notFound(res, "Evaluación nutricional");

        const ev = evaluarPaciente(value);
        Object.assign(evaluacion, construirRegistro(value, ev));
        const saved = await repo.save(evaluacion);

        return res.json({ success: true, data: saved, evaluacion: ev });
    } catch (e) {
        return serverError(res, e, "calculoController.actualizarEvaluacion");
    }
};

/**
 * GET /calculos/ficha/:id_ficha
 * Devuelve la evaluación de una ficha (o data:null con 200 si no existe).
 */
const getEvaluacionPorFicha = async (req, res) => {
    const id_ficha = parseInt(req.params.id_ficha);
    if (isNaN(id_ficha)) return badRequest(res, "El ID de la ficha debe ser un número válido.");

    try {
        const evaluacion = await AppDataSource.getRepository("EvaluacionNutricional")
            .findOne({ where: { ficha: { id_ficha } } });
        return res.json({ success: true, data: evaluacion ?? null });
    } catch (e) {
        return serverError(res, e, "calculoController.getEvaluacionPorFicha");
    }
};

/**
 * GET /calculos/paciente/:id_paciente
 * Historial de evaluaciones del paciente, ordenado por fecha de atención
 * (insumo para el módulo de evolución).
 */
const getHistorialPorPaciente = async (req, res) => {
    const id_paciente = parseInt(req.params.id_paciente);
    if (isNaN(id_paciente)) return badRequest(res, "El ID del paciente debe ser un número válido.");

    try {
        const evaluaciones = await AppDataSource.getRepository("EvaluacionNutricional")
            .createQueryBuilder("ev")
            .leftJoinAndSelect("ev.ficha", "ficha")
            .leftJoinAndSelect("ficha.cita", "cita")
            .leftJoin("cita.paciente", "paciente")
            .where("paciente.id = :id_paciente", { id_paciente })
            .orderBy("ficha.fecha_atencion", "ASC")
            .getMany();

        return res.json({ success: true, data: evaluaciones });
    } catch (e) {
        return serverError(res, e, "calculoController.getHistorialPorPaciente");
    }
};

/**
 * GET /calculos/patologias
 * Catálogo de patologías con su Factor Patología (para el selector de hospitalizados).
 */
const getPatologias = async (_req, res) => {
    return res.json({ success: true, data: FACTOR_PATOLOGIA });
};

module.exports = {
    previewCalculo,
    crearEvaluacion,
    actualizarEvaluacion,
    getEvaluacionPorFicha,
    getHistorialPorPaciente,
    getPatologias,
};
