const Joi = require("joi");

const HORA_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DIAS_VALIDOS = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];
const DURACIONES_VALIDAS = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60];

const createDisponibilidadSchema = Joi.object({
    dia_semana: Joi.string().valid(...DIAS_VALIDOS).required().messages({
        "any.only": `El día debe ser uno de: ${DIAS_VALIDOS.join(", ")}`,
        "any.required": "El día de la semana es requerido",
        "string.empty": "El día de la semana no puede estar vacío",
    }),
    hora_inicio: Joi.string().pattern(HORA_PATTERN).required().messages({
        "string.pattern.base": "La hora de inicio debe tener el formato HH:mm (ej: 09:00)",
        "any.required": "La hora de inicio es requerida",
        "string.empty": "La hora de inicio no puede estar vacía",
    }),
    hora_fin: Joi.string().pattern(HORA_PATTERN).required().messages({
        "string.pattern.base": "La hora de fin debe tener el formato HH:mm (ej: 18:00)",
        "any.required": "La hora de fin es requerida",
        "string.empty": "La hora de fin no puede estar vacía",
    }),
    duracion_minutos: Joi.number().integer().valid(...DURACIONES_VALIDAS).default(30).messages({
        "any.only": `La duración debe ser un múltiplo de 5 entre 5 y 60 minutos`,
        "number.base": "La duración debe ser un número",
    }),
});

const updateDisponibilidadSchema = Joi.object({
    dia_semana: Joi.string().valid(...DIAS_VALIDOS).optional().messages({
        "any.only": `El día debe ser uno de: ${DIAS_VALIDOS.join(", ")}`,
    }),
    hora_inicio: Joi.string().pattern(HORA_PATTERN).optional().messages({
        "string.pattern.base": "La hora de inicio debe tener el formato HH:mm (ej: 09:00)",
    }),
    hora_fin: Joi.string().pattern(HORA_PATTERN).optional().messages({
        "string.pattern.base": "La hora de fin debe tener el formato HH:mm (ej: 18:00)",
    }),
    duracion_minutos: Joi.number().integer().valid(...DURACIONES_VALIDAS).optional().messages({
        "any.only": `La duración debe ser un múltiplo de 5 entre 5 y 60 minutos`,
    }),
});

module.exports = { createDisponibilidadSchema, updateDisponibilidadSchema };
