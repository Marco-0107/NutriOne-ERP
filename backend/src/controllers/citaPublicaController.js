const { citaPublicaSchema } = require("../validations/citaValidations");
const {
    getNutricionistasPublicoService,
    getDisponibilidadPublicaService,
    agendarCitaPublicaService,
} = require("../services/citaPublicaService");
const { badRequest, serverError } = require("../handlers/errorHandler");

const getNutricionistas = async (req, res) => {
    try {
        const data = await getNutricionistasPublicoService();
        return res.json({ success: true, data });
    } catch (err) {
        return serverError(res, err, "citaPublicaController.getNutricionistas");
    }
};

const getDisponibilidad = async (req, res) => {
    const nutricionistaId = parseInt(req.params.nutricionistaId);
    if (isNaN(nutricionistaId)) {
        return badRequest(res, "El ID del nutricionista debe ser un número válido");
    }

    const { fecha } = req.query;
    if (!fecha) {
        return badRequest(res, "La fecha es requerida (query param: ?fecha=YYYY-MM-DD)");
    }

    // Validate date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const requestedDate = new Date(fecha + 'T12:00:00');
    if (requestedDate < today) {
        return badRequest(res, "No se puede consultar disponibilidad para fechas pasadas");
    }

    try {
        const data = await getDisponibilidadPublicaService(nutricionistaId, fecha);
        return res.json({ success: true, data });
    } catch (err) {
        if (err.status) {
            return res.status(err.status).json({ success: false, message: err.message });
        }
        return serverError(res, err, "citaPublicaController.getDisponibilidad");
    }
};

const agendarCita = async (req, res) => {
    const { error, value } = citaPublicaSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const messages = [...new Set(error.details.map(d => d.message))].join(". ");
        return badRequest(res, messages);
    }

    // Validate date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const requestedDate = new Date(value.fecha + 'T12:00:00');
    if (requestedDate < today) {
        return badRequest(res, "No se pueden agendar citas en fechas pasadas");
    }

    try {
        const data = await agendarCitaPublicaService(value);
        return res.status(201).json({ success: true, data });
    } catch (err) {
        if (err.status) {
            return res.status(err.status).json({ success: false, message: err.message });
        }
        return serverError(res, err, "citaPublicaController.agendarCita");
    }
};

module.exports = { getNutricionistas, getDisponibilidad, agendarCita };
