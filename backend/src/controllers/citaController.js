const { createCitaSchema, updateCitaSchema, cancelarCitaSchema } = require("../validations/citaValidations");
const {
    getCitasService,
    getCitaByIdService,
    createCitaService,
    updateCitaService,
    cancelarCitaService,
} = require("../services/citaService");
const { badRequest, serverError } = require("../handlers/errorHandler");

const getCitas = async (req, res) => {
    try {
        const citas = await getCitasService(req.query);
        return res.json({ success: true, data: citas });
    } catch (err) {
        return serverError(res, err, "citaController.getCitas");
    }
};

const getCitaById = async (req, res) => {
    const citaId = parseInt(req.params.id);
    if (isNaN(citaId)) return badRequest(res, "El ID de la cita debe ser un número válido");

    try {
        const cita = await getCitaByIdService(citaId);
        return res.json({ success: true, data: cita });
    } catch (err) {
        if (err.status) return res.status(err.status).json({ success: false, message: err.message });
        return serverError(res, err, "citaController.getCitaById");
    }
};

const createCita = async (req, res) => {
    const { error, value } = createCitaSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const messages = [...new Set(error.details.map(d => d.message))].join(". ");
        return badRequest(res, messages);
    }

    try {
        const cita = await createCitaService(value);
        return res.status(201).json({ success: true, data: cita });
    } catch (err) {
        if (err.status) return res.status(err.status).json({ success: false, message: err.message });
        return serverError(res, err, "citaController.createCita");
    }
};

const updateCita = async (req, res) => {
    const citaId = parseInt(req.params.id);
    if (isNaN(citaId)) return badRequest(res, "El ID de la cita debe ser un número válido");

    const { error, value } = updateCitaSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const messages = [...new Set(error.details.map(d => d.message))].join(". ");
        return badRequest(res, messages);
    }

    try {
        const cita = await updateCitaService(citaId, value);
        return res.json({ success: true, data: cita });
    } catch (err) {
        if (err.status) return res.status(err.status).json({ success: false, message: err.message });
        return serverError(res, err, "citaController.updateCita");
    }
};

const cancelarCita = async (req, res) => {
    const citaId = parseInt(req.params.id);
    if (isNaN(citaId)) return badRequest(res, "El ID de la cita debe ser un número válido");

    const { error, value } = cancelarCitaSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const messages = [...new Set(error.details.map(d => d.message))].join(". ");
        return badRequest(res, messages);
    }

    try {
        const cita = await cancelarCitaService(citaId, value.motivo_cancelacion);
        return res.json({ success: true, data: cita });
    } catch (err) {
        if (err.status) return res.status(err.status).json({ success: false, message: err.message });
        return serverError(res, err, "citaController.cancelarCita");
    }
};

module.exports = { getCitas, getCitaById, createCita, updateCita, cancelarCita };
