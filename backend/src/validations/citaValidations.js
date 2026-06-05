const Joi = require("joi");

const HORA_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const HORA_MESSAGES = {
    "string.pattern.base": "La hora debe tener el formato HH:mm (ej: 09:00, 14:30)",
};

const updateCitaSchema = Joi.object({
    id_paciente: Joi.number().integer().positive().optional(),
    id_usuario: Joi.number().integer().positive().optional(),
    fecha: Joi.string().isoDate().optional(),
    hora_inicio: Joi.string().pattern(HORA_PATTERN).optional().messages(HORA_MESSAGES),
    hora_fin: Joi.string().pattern(HORA_PATTERN).optional().messages(HORA_MESSAGES),
    estado: Joi.string().valid("pendiente", "confirmada", "cancelada", "completada").optional().messages({
        "any.only": "El estado debe ser: pendiente, confirmada, cancelada o completada",
    }),
    observacion: Joi.string().max(1000).allow("", null).optional(),
    id_servicio: Joi.number().integer().positive().allow(null).optional(),
});

const cancelarCitaSchema = Joi.object({
    motivo_cancelacion: Joi.string().min(5).max(255).required().messages({
        "string.min": "El motivo de cancelación debe tener al menos 5 caracteres",
        "string.max": "El motivo de cancelación no puede superar los 255 caracteres",
        "any.required": "El motivo de cancelación es requerido",
        "string.empty": "El motivo de cancelación no puede estar vacío",
    }),
});

// Schema for public booking - includes patient data
const RUT_PATTERN    = /^\d{1,3}(\.\d{3}){1,2}-[\dkK]$/i;
const NOMBRE_PATTERN = /^[\p{L}\s'.-]+$/u;
const PHONE_PATTERN  = /^\+?56[2-9]\d{8}$|^\+?[1-9]\d{7,14}$/; // Chilean (+569XXXXXXXX) or international

const enviarOtpSchema = Joi.object({
    telefono:       Joi.string().pattern(PHONE_PATTERN).required().messages({
        "string.pattern.base": "El teléfono debe ser un número válido (ej: +56912345678)",
        "any.required":        "El teléfono es requerido",
        "string.empty":        "El teléfono no puede estar vacío",
    }),
    recaptcha_token: Joi.string().required().messages({
        "any.required": "Token reCAPTCHA requerido",
        "string.empty": "Token reCAPTCHA no puede estar vacío",
    }),
});

const verificarOtpSchema = Joi.object({
    telefono: Joi.string().pattern(PHONE_PATTERN).required().messages({
        "string.pattern.base": "Teléfono inválido",
        "any.required":        "El teléfono es requerido",
    }),
    codigo: Joi.string().length(6).pattern(/^\d{6}$/).required().messages({
        "string.length":       "El código debe tener exactamente 6 dígitos",
        "string.pattern.base": "El código debe contener solo números",
        "any.required":        "El código de verificación es requerido",
    }),
});

const citaPublicaSchema = Joi.object({
    // Patient data
    rut: Joi.string().pattern(RUT_PATTERN).required().messages({
        "string.pattern.base": "El RUT debe tener el formato correcto con puntos (ej: 12.345.678-9)",
        "any.required": "El RUT es requerido",
        "string.empty": "El RUT no puede estar vacío",
    }),
    nombres: Joi.string().min(2).max(150).pattern(NOMBRE_PATTERN).required().messages({
        "string.min": "Los nombres deben tener al menos 2 caracteres",
        "string.max": "Los nombres no pueden superar los 150 caracteres",
        "string.pattern.base": "Solo se permiten letras, espacios, guiones y puntos",
        "any.required": "Los nombres son requeridos",
        "string.empty": "Los nombres no pueden estar vacíos",
    }),
    apellido_paterno: Joi.string().min(2).max(100).pattern(NOMBRE_PATTERN).required().messages({
        "string.min": "El apellido paterno debe tener al menos 2 caracteres",
        "string.max": "El apellido paterno no puede superar los 100 caracteres",
        "string.pattern.base": "Solo se permiten letras, espacios, guiones y puntos",
        "any.required": "El apellido paterno es requerido",
        "string.empty": "El apellido paterno no puede estar vacío",
    }),
    apellido_materno: Joi.string().min(2).max(100).pattern(NOMBRE_PATTERN).required().messages({
        "string.min": "El apellido materno debe tener al menos 2 caracteres",
        "string.max": "El apellido materno no puede superar los 100 caracteres",
        "string.pattern.base": "Solo se permiten letras, espacios, guiones y puntos",
        "any.required": "El apellido materno es requerido",
        "string.empty": "El apellido materno no puede estar vacío",
    }),
    telefono: Joi.string().pattern(PHONE_PATTERN).required().messages({
        "string.pattern.base": "El teléfono debe ser un número válido (ej: +56912345678)",
        "any.required": "El teléfono es requerido",
        "string.empty": "El teléfono no puede estar vacío",
    }),
    verification_token: Joi.string().required().messages({
        "any.required": "Token de verificación requerido. Verifica tu número de teléfono primero",
        "string.empty": "Token de verificación inválido",
    }),
    fecha_nacimiento: Joi.string().isoDate().required().messages({
        "string.isoDate": "La fecha de nacimiento debe tener un formato válido (YYYY-MM-DD)",
        "any.required": "La fecha de nacimiento es requerida",
        "string.empty": "La fecha de nacimiento no puede estar vacía",
    }),
    // Appointment data
    id_usuario: Joi.number().integer().positive().required().messages({
        "number.base": "Debe seleccionar un nutricionista",
        "any.required": "El nutricionista es requerido",
    }),
    fecha: Joi.string().isoDate().required().messages({
        "string.isoDate": "La fecha debe tener un formato válido (YYYY-MM-DD)",
        "any.required": "La fecha de la cita es requerida",
        "string.empty": "La fecha de la cita no puede estar vacía",
    }),
    hora_inicio: Joi.string().pattern(HORA_PATTERN).required().messages({
        ...HORA_MESSAGES,
        "any.required": "La hora de inicio es requerida",
    }),
    hora_fin: Joi.string().pattern(HORA_PATTERN).required().messages({
        ...HORA_MESSAGES,
        "any.required": "La hora de fin es requerida",
    }),
    observacion: Joi.string().max(1000).allow("", null).optional().messages({
        "string.max": "La observación no puede superar los 1000 caracteres",
    }),
});

module.exports = {
    updateCitaSchema,
    cancelarCitaSchema,
    citaPublicaSchema,
    enviarOtpSchema,
    verificarOtpSchema,
};
