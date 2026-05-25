const Joi = require("joi");

/**
 * Validaciones Joi para los endpoints de autenticación
 */

/**
 * Valida el body del request de inicio de sesión.
 * Requerido: correo (email válido) y contrasena (mínimo 6 caracteres).
 */
const loginSchema = Joi.object({
    correo: Joi.string()
        .email({ tlds: { allow: false } })
        .required()
        .messages({
            "string.email": "El correo debe ser una dirección de email válida",
            "any.required": "El correo es requerido",
            "string.empty": "El correo no puede estar vacío"
        }),

    contrasena: Joi.string()
        .min(6)
        .required()
        .messages({
            "string.min": "La contraseña debe tener al menos 6 caracteres",
            "any.required": "La contraseña es requerida",
            "string.empty": "La contraseña no puede estar vacía"
        })
});

module.exports = {
    loginSchema
};
