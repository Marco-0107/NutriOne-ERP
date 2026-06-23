const Joi = require("joi");

const RUT_PATTERN   = /^\d{1,3}(\.\d{3}){1,2}-[\dkK]$/i;
const RUT_MESSAGES  = {
    "string.pattern.base": "El RUT debe tener el formato correcto con puntos (ej: 12.345.678-9)",
    "any.required":        "El RUT es requerido",
    "string.empty":        "El RUT no puede estar vacío",
};

const NOMBRE_PATTERN  = /^[\p{L}\s'.-]+$/u;
const NOMBRE_MESSAGES = { "string.pattern.base": "Solo se permiten letras, espacios, guiones y puntos" };

const PHONE_PATTERN  = /^\+?56[2-9]\d{8}$|^\+?[1-9]\d{7,14}$/;
const PHONE_MESSAGES = { "string.pattern.base": "El teléfono debe ser un número válido (ej: +56912345678)" };

// Los pacientes NO tienen correo ni contraseña gestionados externamente.
// El backend genera credenciales internas al crear el usuario asociado.

const createPacienteSchema = Joi.object({
    rut: Joi.string()
        .pattern(RUT_PATTERN)
        .required()
        .messages(RUT_MESSAGES),

    nombres: Joi.string()
        .min(2).max(150)
        .pattern(NOMBRE_PATTERN)
        .required()
        .messages({
            "string.min":          "Los nombres deben tener al menos 2 caracteres",
            "string.max":          "Los nombres no pueden superar los 150 caracteres",
            "string.pattern.base": NOMBRE_MESSAGES["string.pattern.base"],
            "any.required":        "Los nombres son requeridos",
            "string.empty":        "Los nombres no pueden estar vacíos",
        }),

    apellido_paterno: Joi.string()
        .min(2).max(100)
        .pattern(NOMBRE_PATTERN)
        .required()
        .messages({
            "string.min":          "El apellido paterno debe tener al menos 2 caracteres",
            "string.max":          "El apellido paterno no puede superar los 100 caracteres",
            "string.pattern.base": NOMBRE_MESSAGES["string.pattern.base"],
            "any.required":        "El apellido paterno es requerido",
            "string.empty":        "El apellido paterno no puede estar vacío",
        }),

    apellido_materno: Joi.string()
        .min(2).max(100)
        .pattern(NOMBRE_PATTERN)
        .required()
        .messages({
            "string.min":          "El apellido materno debe tener al menos 2 caracteres",
            "string.max":          "El apellido materno no puede superar los 100 caracteres",
            "string.pattern.base": NOMBRE_MESSAGES["string.pattern.base"],
            "any.required":        "El apellido materno es requerido",
            "string.empty":        "El apellido materno no puede estar vacío",
        }),

    fecha_nacimiento: Joi.string()
        .isoDate()
        .required()
        .messages({
            "string.isoDate": "La fecha de nacimiento debe tener un formato válido (YYYY-MM-DD)",
            "any.required":   "La fecha de nacimiento es requerida",
            "string.empty":   "La fecha de nacimiento no puede estar vacía",
        }),

    prevision: Joi.string()
        .max(100)
        .allow("", null)
        .optional()
        .messages({
            "string.max": "La previsión no puede superar los 100 caracteres",
        }),

    telefono: Joi.string()
        .pattern(PHONE_PATTERN)
        .allow("", null)
        .optional()
        .messages(PHONE_MESSAGES),
}).options({ stripUnknown: true });

const updatePacienteSchema = Joi.object({
    rut: Joi.string()
        .pattern(RUT_PATTERN)
        .optional()
        .messages(RUT_MESSAGES),

    nombres: Joi.string()
        .min(2).max(150)
        .pattern(NOMBRE_PATTERN)
        .optional()
        .messages({
            "string.min":          "Los nombres deben tener al menos 2 caracteres",
            "string.max":          "Los nombres no pueden superar los 150 caracteres",
            "string.pattern.base": NOMBRE_MESSAGES["string.pattern.base"],
        }),

    apellido_paterno: Joi.string()
        .min(2).max(100)
        .pattern(NOMBRE_PATTERN)
        .optional()
        .messages({
            "string.min":          "El apellido paterno debe tener al menos 2 caracteres",
            "string.max":          "El apellido paterno no puede superar los 100 caracteres",
            "string.pattern.base": NOMBRE_MESSAGES["string.pattern.base"],
        }),

    apellido_materno: Joi.string()
        .min(2).max(100)
        .pattern(NOMBRE_PATTERN)
        .optional()
        .messages({
            "string.min":          "El apellido materno debe tener al menos 2 caracteres",
            "string.max":          "El apellido materno no puede superar los 100 caracteres",
            "string.pattern.base": NOMBRE_MESSAGES["string.pattern.base"],
        }),

    fecha_nacimiento: Joi.string()
        .isoDate()
        .optional()
        .messages({
            "string.isoDate": "La fecha de nacimiento debe tener un formato válido (YYYY-MM-DD)",
        }),

    prevision: Joi.string()
        .max(100)
        .allow("", null)
        .optional()
        .messages({
            "string.max": "La previsión no puede superar los 100 caracteres",
        }),

    telefono: Joi.string()
        .pattern(PHONE_PATTERN)
        .allow("", null)
        .optional()
        .messages(PHONE_MESSAGES),
}).options({ stripUnknown: true });

module.exports = { createPacienteSchema, updatePacienteSchema };
