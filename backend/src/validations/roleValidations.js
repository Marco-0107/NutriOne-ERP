const Joi = require("joi");

/**
 * Validaciones Joi para los endpoints de gestión de Roles
 */

/**
 * Valida el body para crear un nuevo rol.
 * Requerido: nombre. Opcionales: descripcion, permisos (array de IDs).
 */
const createRoleSchema = Joi.object({
    nombre: Joi.string()
        .min(2)
        .max(100)
        .required()
        .messages({
            "string.min":   "El nombre del rol debe tener al menos 2 caracteres",
            "string.max":   "El nombre del rol no puede superar los 100 caracteres",
            "any.required": "El nombre del rol es requerido",
            "string.empty": "El nombre del rol no puede estar vacío"
        }),

    descripcion: Joi.string()
        .max(255)
        .allow("", null)
        .optional()
        .messages({
            "string.max": "La descripción no puede superar los 255 caracteres"
        }),

    permisos: Joi.array()
        .items(Joi.number().integer().positive())
        .optional()
        .default([])
        .messages({
            "array.base": "Los permisos deben ser un arreglo de IDs numéricos"
        })
});

/**
 * Valida el body para actualizar un rol existente.
 * Mismas reglas que crear, pero se aplica sobre un rol ya existente.
 */
const updateRoleSchema = Joi.object({
    nombre: Joi.string()
        .min(2)
        .max(100)
        .required()
        .messages({
            "string.min":   "El nombre del rol debe tener al menos 2 caracteres",
            "string.max":   "El nombre del rol no puede superar los 100 caracteres",
            "any.required": "El nombre del rol es requerido",
            "string.empty": "El nombre del rol no puede estar vacío"
        }),

    descripcion: Joi.string()
        .max(255)
        .allow("", null)
        .optional()
        .messages({
            "string.max": "La descripción no puede superar los 255 caracteres"
        }),

    permisos: Joi.array()
        .items(Joi.number().integer().positive())
        .optional()
        .default([])
        .messages({
            "array.base": "Los permisos deben ser un arreglo de IDs numéricos"
        })
});

module.exports = {
    createRoleSchema,
    updateRoleSchema
};
