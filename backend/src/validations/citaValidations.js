const Joi = require("joi");

const HORA_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const HORA_MESSAGES = {
    "string.pattern.base": "La hora debe tener el formato HH:mm (ej: 09:00, 14:30)",
};

const createCitaSchema = Joi.object({
    id_paciente: Joi.number().integer().positive().required().messages({
        "number.base": "El ID del paciente debe ser un número",
        "any.required": "El paciente es requerido",
    }),
    id_usuario: Joi.number().integer().positive().required().messages({
        "number.base": "El ID del nutricionista debe ser un número",
        "any.required": "El nutricionista es requerido",
    }),
    fecha: Joi.string().isoDate().required().messages({
        "string.isoDate": "La fecha debe tener un formato válido (YYYY-MM-DD)",
        "any.required": "La fecha es requerida",
        "string.empty": "La fecha no puede estar vacía",
    }),
    hora_inicio: Joi.string().pattern(HORA_PATTERN).required().messages({
        ...HORA_MESSAGES,
        "any.required": "La hora de inicio es requerida",
        "string.empty": "La hora de inicio no puede estar vacía",
    }),
    hora_fin: Joi.string().pattern(HORA_PATTERN).required().messages({
        ...HORA_MESSAGES,
        "any.required": "La hora de fin es requerida",
        "string.empty": "La hora de fin no puede estar vacía",
    }),
    observacion: Joi.string().max(1000).allow("", null).optional().messages({
        "string.max": "La observación no puede superar los 1000 caracteres",
    }),
    id_servicio: Joi.number().integer().positive().allow(null).optional().messages({
        "number.base": "El ID del servicio debe ser un número",
    }),
});

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
const RUT_PATTERN = /^\d{1,3}(\.\d{3}){1,2}-[\dkK]$/i;
const NOMBRE_PATTERN = /^[\p{L}\s'.-]+$/u;

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
    createCitaSchema,
    updateCitaSchema,
    cancelarCitaSchema,
    citaPublicaSchema,
};
