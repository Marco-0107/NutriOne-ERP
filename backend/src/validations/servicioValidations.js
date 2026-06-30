const Joi = require("joi");

const PREVISIONES_VALIDAS = ["particular", "fonasa", "isapre"];
const DURACION_MIN = 5;
const DURACION_MAX = 240;

const createServicioSchema = Joi.object({
    id_user: Joi.number().integer().positive().optional().messages({
        "number.base": "El ID del profesional debe ser un número válido",
    }),
    nombre: Joi.string().min(2).max(150).required().messages({
        "string.min": "El nombre debe tener al menos 2 caracteres",
        "string.max": "El nombre no puede superar los 150 caracteres",
        "any.required": "El nombre del servicio es requerido",
        "string.empty": "El nombre del servicio no puede estar vacío",
    }),
    descripcion: Joi.string().max(1000).allow("", null).optional().messages({
        "string.max": "La descripción no puede superar los 1000 caracteres",
    }),
    precio: Joi.number().positive().precision(2).required().messages({
        "number.base": "El precio debe ser un número válido",
        "number.positive": "El precio debe ser mayor a 0",
        "any.required": "El precio es requerido",
    }),
    duracion_minutos: Joi.number().integer().min(DURACION_MIN).max(DURACION_MAX).required().messages({
        "number.base": "La duración debe ser un número válido",
        "number.min": `La duración mínima es de ${DURACION_MIN} minutos`,
        "number.max": `La duración máxima es de ${DURACION_MAX} minutos`,
        "any.required": "La duración en minutos es requerida",
    }),
    prevision: Joi.string().valid(...PREVISIONES_VALIDAS).default("particular").messages({
        "any.only": `La previsión debe ser una de: ${PREVISIONES_VALIDAS.join(", ")}`,
    }),
    estado: Joi.string().valid("activo", "inactivo").optional(),
});

const updateServicioSchema = Joi.object({
    nombre: Joi.string().min(2).max(150).optional().messages({
        "string.min": "El nombre debe tener al menos 2 caracteres",
        "string.max": "El nombre no puede superar los 150 caracteres",
    }),
    descripcion: Joi.string().max(1000).allow("", null).optional(),
    precio: Joi.number().positive().precision(2).optional().messages({
        "number.positive": "El precio debe ser mayor a 0",
    }),
    duracion_minutos: Joi.number().integer().min(DURACION_MIN).max(DURACION_MAX).optional().messages({
        "number.min": `La duración mínima es de ${DURACION_MIN} minutos`,
        "number.max": `La duración máxima es de ${DURACION_MAX} minutos`,
    }),
    prevision: Joi.string().valid(...PREVISIONES_VALIDAS).optional().messages({
        "any.only": `La previsión debe ser una de: ${PREVISIONES_VALIDAS.join(", ")}`,
    }),
    estado: Joi.string().valid("activo", "inactivo").optional(),
});

module.exports = { createServicioSchema, updateServicioSchema, PREVISIONES_VALIDAS };
