const { createDisponibilidadSchema, updateDisponibilidadSchema } = require("../validations/disponibilidadValidations");
const {
    getDisponibilidadService,
    createDisponibilidadService,
    updateDisponibilidadService,
    deleteDisponibilidadService,
} = require("../services/disponibilidadService");
const { badRequest, serverError } = require("../handlers/errorHandler");

const getDisponibilidad = async (req, res) => {
    try {
        // If query param nutricionista_id is provided, filter by it
        // Otherwise, if the user is a nutricionista, show only their own
        const esNutricionista = req.user.roles && req.user.roles.includes("Nutricionista");

        // Nutricionistas always see only their own; admins can filter by query param
        let nutricionistaId = esNutricionista
            ? req.user.id
            : (req.query.nutricionista_id || null);
        
        const data = await getDisponibilidadService(nutricionistaId);
        return res.json({ success: true, data });
    } catch (err) {
        return serverError(res, err, "disponibilidadController.getDisponibilidad");
    }
};

const createDisponibilidad = async (req, res) => {
    const { error, value } = createDisponibilidadSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const messages = [...new Set(error.details.map(d => d.message))].join(". ");
        return badRequest(res, messages);
    }

    try {
        // Use the nutricionista_id from body, or default to the logged-in user's ID
        const nutricionistaId = req.body.nutricionista_id || req.user.id;
        const data = await createDisponibilidadService(nutricionistaId, value);
        return res.status(201).json({ success: true, data });
    } catch (err) {
        if (err.status) {
            return res.status(err.status).json({ success: false, message: err.message });
        }
        return serverError(res, err, "disponibilidadController.createDisponibilidad");
    }
};

const updateDisponibilidad = async (req, res) => {
    const dispId = parseInt(req.params.id);
    if (isNaN(dispId)) {
        return badRequest(res, "El ID de disponibilidad debe ser un número válido");
    }

    const { error, value } = updateDisponibilidadSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const messages = [...new Set(error.details.map(d => d.message))].join(". ");
        return badRequest(res, messages);
    }

    try {
        const data = await updateDisponibilidadService(dispId, value);
        return res.json({ success: true, data });
    } catch (err) {
        if (err.status) {
            return res.status(err.status).json({ success: false, message: err.message });
        }
        return serverError(res, err, "disponibilidadController.updateDisponibilidad");
    }
};

const deleteDisponibilidad = async (req, res) => {
    const dispId = parseInt(req.params.id);
    if (isNaN(dispId)) {
        return badRequest(res, "El ID de disponibilidad debe ser un número válido");
    }

    try {
        const result = await deleteDisponibilidadService(dispId);
        return res.json({ success: true, ...result });
    } catch (err) {
        if (err.status) {
            return res.status(err.status).json({ success: false, message: err.message });
        }
        return serverError(res, err, "disponibilidadController.deleteDisponibilidad");
    }
};

module.exports = { getDisponibilidad, createDisponibilidad, updateDisponibilidad, deleteDisponibilidad };
