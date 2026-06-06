const Joi = require("joi");

const RUT_PATTERN  = /^\d{1,3}(\.\d{3}){1,2}-[\dkK]$/i;
const RUT_MESSAGES = {
    "string.pattern.base": "El RUT debe tener el formato correcto con puntos (ej: 12.345.678-9)",
    "any.required":        "El RUT es requerido",
    "string.empty":        "El RUT no puede estar vacío",
};

const NOMBRE_PATTERN  = /^[\p{L}\s'.-]+$/u;
const NOMBRE_MESSAGES = { "string.pattern.base": "Solo se permiten letras, espacios, guiones y puntos" };

const createUsuarioSchema = Joi.object({
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

    correo: Joi.string()
        .email().max(150)
        .required()
        .messages({
            "string.email":  "El correo electrónico no tiene un formato válido",
            "string.max":    "El correo no puede superar los 150 caracteres",
            "any.required":  "El correo electrónico es requerido",
            "string.empty":  "El correo no puede estar vacío",
        }),

    contrasena: Joi.string()
        .min(6).max(100)
        .required()
        .messages({
            "string.min":    "La contraseña debe tener al menos 6 caracteres",
            "string.max":    "La contraseña no puede superar los 100 caracteres",
            "any.required":  "La contraseña es requerida",
            "string.empty":  "La contraseña no puede estar vacía",
        }),
});

const updateUsuarioSchema = Joi.object({
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

    correo: Joi.string()
        .email().max(150)
        .optional()
        .messages({
            "string.email": "El correo electrónico no tiene un formato válido",
            "string.max":   "El correo no puede superar los 150 caracteres",
        }),
});

const assignRolSchema = Joi.object({
    rol: Joi.string()
        .min(1).max(100)
        .required()
        .messages({
            "any.required": "El rol es requerido",
            "string.empty": "El rol no puede estar vacío",
        }),
});

module.exports = { createUsuarioSchema, updateUsuarioSchema, assignRolSchema };
