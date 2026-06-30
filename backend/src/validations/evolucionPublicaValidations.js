const Joi = require("joi");

const RUT_PATTERN   = /^\d{1,3}(\.\d{3}){1,2}-[\dkK]$/i;
const PHONE_PATTERN = /^\+?56[2-9]\d{8}$|^\+?[1-9]\d{7,14}$/;

const enviarOtpEvolucionSchema = Joi.object({
    rut: Joi.string().pattern(RUT_PATTERN).required().messages({
        "string.pattern.base": "El RUT debe tener el formato correcto con puntos (ej: 12.345.678-9)",
        "any.required": "El RUT es requerido",
        "string.empty": "El RUT no puede estar vacío",
    }),
    telefono: Joi.string().pattern(PHONE_PATTERN).required().messages({
        "string.pattern.base": "El teléfono debe ser un número válido (ej: +56912345678)",
        "any.required": "El teléfono es requerido",
        "string.empty": "El teléfono no puede estar vacío",
    }),
    recaptcha_token: Joi.string().required().messages({
        "any.required": "Token reCAPTCHA requerido",
        "string.empty": "Token reCAPTCHA no puede estar vacío",
    }),
});

const verificarOtpEvolucionSchema = Joi.object({
    telefono: Joi.string().pattern(PHONE_PATTERN).required().messages({
        "string.pattern.base": "Teléfono inválido",
        "any.required": "El teléfono es requerido",
    }),
    codigo: Joi.string().length(6).pattern(/^\d{6}$/).required().messages({
        "string.length": "El código debe tener exactamente 6 dígitos",
        "string.pattern.base": "El código debe contener solo números",
        "any.required": "El código de verificación es requerido",
    }),
});

const consultarEvolucionSchema = Joi.object({
    rut: Joi.string().pattern(RUT_PATTERN).required().messages({
        "string.pattern.base": "El RUT debe tener el formato correcto con puntos (ej: 12.345.678-9)",
        "any.required": "El RUT es requerido",
    }),
    telefono: Joi.string().pattern(PHONE_PATTERN).required().messages({
        "string.pattern.base": "El teléfono debe ser un número válido (ej: +56912345678)",
        "any.required": "El teléfono es requerido",
    }),
    verification_token: Joi.string().required().messages({
        "any.required": "Token de verificación requerido. Verifica tu número de teléfono primero",
        "string.empty": "Token de verificación inválido",
    }),
});

module.exports = { enviarOtpEvolucionSchema, verificarOtpEvolucionSchema, consultarEvolucionSchema };
