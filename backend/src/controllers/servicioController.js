const { createServicioSchema, updateServicioSchema } = require("../validations/servicioValidations");
const {
    getServiciosService,
    getServicioByIdService,
    createServicioService,
    updateServicioService,
    deleteServicioService,
} = require("../services/servicioService");
const { badRequest, serverError } = require("../handlers/errorHandler");

const getServicios = async (req, res) => {
    try {
        const esNutricionista = req.user.roles && req.user.roles.includes("Nutricionista");

        const filtros = {
            id_user: esNutricionista ? req.user.id : (req.query.id_user || null),
            estado:  req.query.estado,
        };

        const data = await getServiciosService(filtros);
        return res.json({ success: true, data });
    } catch (err) {
        return serverError(res, err, "servicioController.getServicios");
    }
};

const getServicioById = async (req, res) => {
    const servicioId = parseInt(req.params.id);
    if (isNaN(servicioId)) return badRequest(res, "El ID del servicio debe ser un número válido");

    try {
        const data = await getServicioByIdService(servicioId);
        return res.json({ success: true, data });
    } catch (err) {
        if (err.status) return res.status(err.status).json({ success: false, message: err.message });
        return serverError(res, err, "servicioController.getServicioById");
    }
};

const createServicio = async (req, res) => {
    const { error, value } = createServicioSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const messages = [...new Set(error.details.map(d => d.message))].join(". ");
        return badRequest(res, messages);
    }

    try {
        const nutricionistaId = value.id_user || req.user.id;
        const data = await createServicioService(nutricionistaId, value);
        return res.status(201).json({ success: true, data });
    } catch (err) {
        if (err.status) return res.status(err.status).json({ success: false, message: err.message });
        return serverError(res, err, "servicioController.createServicio");
    }
};

const updateServicio = async (req, res) => {
    const servicioId = parseInt(req.params.id);
    if (isNaN(servicioId)) return badRequest(res, "El ID del servicio debe ser un número válido");

    const { error, value } = updateServicioSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const messages = [...new Set(error.details.map(d => d.message))].join(". ");
        return badRequest(res, messages);
    }

    try {
        const data = await updateServicioService(servicioId, value);
        return res.json({ success: true, data });
    } catch (err) {
        if (err.status) return res.status(err.status).json({ success: false, message: err.message });
        return serverError(res, err, "servicioController.updateServicio");
    }
};

const deleteServicio = async (req, res) => {
    const servicioId = parseInt(req.params.id);
    if (isNaN(servicioId)) return badRequest(res, "El ID del servicio debe ser un número válido");

    try {
        const result = await deleteServicioService(servicioId);
        return res.json({ success: true, ...result });
    } catch (err) {
        if (err.status) return res.status(err.status).json({ success: false, message: err.message });
        return serverError(res, err, "servicioController.deleteServicio");
    }
};

module.exports = { getServicios, getServicioById, createServicio, updateServicio, deleteServicio };
