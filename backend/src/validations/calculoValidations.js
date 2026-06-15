const Joi = require("joi");

/**
 * Validaciones del módulo de Cálculos Nutricionales (Sprint 4).
 * Las mediciones son opcionales (la calculadora trabaja con lo que haya y
 * muestra "N/D" en lo que falte); se validan tipos y rangos plausibles.
 */

const medida = (max) =>
    Joi.number().min(0).max(max).allow(null, "").optional();

const perimetrosSchema = Joi.object({
    muneca:      medida(80),
    cintura:     medida(300),
    cadera:      medida(300),
    cuello:      medida(120),
    pantorrilla: medida(120),
    braquial:    medida(120),
    cefalico:    medida(120),
}).optional();

const plieguesSchema = Joi.object({
    tricipital:   medida(100),
    bicipital:    medida(100),
    subescapular: medida(100),
    crestaIliaca: medida(100),
    supraespinal: medida(100),
    abdominal:    medida(100),
}).optional();

const actividadSchema = Joi.object({
    categoria: Joi.string().valid("sedentario", "moderado", "vigoroso").allow(null, "").optional(),
    pal:       Joi.number().min(1).max(2.5).allow(null, "").optional(),
}).optional();

const macrosSchema = Joi.object({
    proPct: Joi.number().min(0).max(100).allow(null, "").optional(),
    choPct: Joi.number().min(0).max(100).allow(null, "").optional(),
    lipPct: Joi.number().min(0).max(100).allow(null, "").optional(),
}).optional();

/** Esquema compartido por preview y guardar. */
const evaluacionSchema = Joi.object({
    sexo:            Joi.string().max(30).allow(null, "").optional(),
    edadAnios:       Joi.number().min(0).max(120).allow(null, "").optional(),
    fechaNacimiento: Joi.string().isoDate().allow(null, "").optional(),
    fechaAtencion:   Joi.string().isoDate().allow(null, "").optional(),

    embarazada: Joi.boolean().optional(),
    nodriza:    Joi.boolean().optional(),
    maduracion: Joi.string().valid("prepuber", "puber").allow(null, "").optional(),
    periodoPP:  Joi.string().valid("1s", "1m", "3m", "6m").allow(null, "").optional(),

    pesoActual:   medida(500),
    pesoHabitual: medida(500),
    tallaCm:      medida(250),
    imcMeta:      Joi.number().min(10).max(60).allow(null, "").optional(),

    perimetros: perimetrosSchema,
    pliegues:   plieguesSchema,

    actividad:     actividadSchema,
    hospitalizado: Joi.boolean().optional(),
    patologia:     Joi.string().max(80).allow(null, "").optional(),
    fp:            Joi.number().min(0.5).max(2.5).allow(null, "").optional(),

    macros: macrosSchema,
}).options({ convert: true, stripUnknown: true });

module.exports = { evaluacionSchema };
