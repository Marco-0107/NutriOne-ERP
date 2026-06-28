"use strict";
const Joi = require("joi");

const METODOS_PAGO_VALIDOS = ["efectivo", "tarjeta", "transferencia", "cheque"];

const generarCobroSchema = Joi.object({
    id_cita: Joi.number().integer().positive().required()
        .messages({
            "any.required": "El id_cita es obligatorio",
            "number.base":  "El id_cita debe ser un número entero positivo",
        }),
    notas: Joi.string().max(500).optional().allow("", null),
});

const registrarPagoSchema = Joi.object({
    monto: Joi.number().positive().precision(2).required()
        .messages({
            "any.required":    "El monto es obligatorio",
            "number.base":     "El monto debe ser un número",
            "number.positive": "El monto debe ser mayor a cero",
        }),
    metodo_pago: Joi.string()
        .valid(...METODOS_PAGO_VALIDOS)
        .required()
        .messages({
            "any.required": "El método de pago es obligatorio",
            "any.only":     `El método de pago debe ser uno de: ${METODOS_PAGO_VALIDOS.join(", ")}`,
        }),
    notas: Joi.string().max(500).optional().allow("", null),
});

const movimientosCajaSchema = Joi.object({
    desde:            Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional().messages({ 'string.pattern.base': 'La fecha debe tener formato YYYY-MM-DD' }),
    hasta:            Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional().messages({ 'string.pattern.base': 'La fecha debe tener formato YYYY-MM-DD' }),
    nutricionista_id: Joi.number().integer().positive().optional(),
});

module.exports = {
    generarCobroSchema,
    registrarPagoSchema,
    movimientosCajaSchema,
};
