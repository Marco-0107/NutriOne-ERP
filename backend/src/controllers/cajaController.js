"use strict";
const {
    generarCobroSchema,
    registrarPagoSchema,
    movimientosCajaSchema,
} = require("../validations/cajaValidations");

const {
    generarCobro,
    registrarPago,
    getCobro,
    getCobros,
    getResumenPaciente,
    getMovimientosCaja,
    anularCobro,
} = require("../services/cajaService");

const { badRequest, serverError } = require("../handlers/errorHandler");

const generarCobroController = async (req, res) => {
    const { error, value } = generarCobroSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const messages = [...new Set(error.details.map((d) => d.message))].join(". ");
        return badRequest(res, messages);
    }

    try {
        const data = await generarCobro(value.id_cita);
        return res.status(201).json({ success: true, data });
    } catch (err) {
        if (err.status) return res.status(err.status).json({ success: false, message: err.message });
        return serverError(res, err, "cajaController.generarCobro");
    }
};

const getCobrosController = async (req, res) => {
    try {
        const data = await getCobros({ nutricionistaId: req.user.id });
        return res.json({ success: true, data });
    } catch (err) {
        if (err.status) return res.status(err.status).json({ success: false, message: err.message });
        return serverError(res, err, "cajaController.getCobros");
    }
};

const getCobroController = async (req, res) => {
    const cobroId = parseInt(req.params.id);
    if (isNaN(cobroId)) return badRequest(res, "El ID del cobro debe ser un número válido");

    try {
        const data = await getCobro(cobroId);
        return res.json({ success: true, data });
    } catch (err) {
        if (err.status) return res.status(err.status).json({ success: false, message: err.message });
        return serverError(res, err, "cajaController.getCobro");
    }
};

const registrarPagoController = async (req, res) => {
    const cobroId = parseInt(req.params.id);
    if (isNaN(cobroId)) return badRequest(res, "El ID del cobro debe ser un número válido");

    const { error, value } = registrarPagoSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const messages = [...new Set(error.details.map((d) => d.message))].join(". ");
        return badRequest(res, messages);
    }

    try {
        const data = await registrarPago(cobroId, value);
        return res.status(201).json({ success: true, data });
    } catch (err) {
        if (err.status) return res.status(err.status).json({ success: false, message: err.message });
        return serverError(res, err, "cajaController.registrarPago");
    }
};

const getResumenPacienteController = async (req, res) => {
    const pacienteId = parseInt(req.params.id_paciente);
    if (isNaN(pacienteId)) return badRequest(res, "El ID del paciente debe ser un número válido");

    try {
        const data = await getResumenPaciente(pacienteId);
        return res.json({ success: true, data });
    } catch (err) {
        if (err.status) return res.status(err.status).json({ success: false, message: err.message });
        return serverError(res, err, "cajaController.getResumenPaciente");
    }
};

const getMovimientosCajaController = async (req, res) => {
    const { error, value } = movimientosCajaSchema.validate(req.query, { abortEarly: false });
    if (error) {
        const messages = [...new Set(error.details.map((d) => d.message))].join(". ");
        return badRequest(res, messages);
    }

    try {
        const data = await getMovimientosCaja({
            desde:           value.desde,
            hasta:           value.hasta,
            nutricionistaId: req.user.id,
        });
        return res.json({ success: true, data });
    } catch (err) {
        if (err.status) return res.status(err.status).json({ success: false, message: err.message });
        return serverError(res, err, "cajaController.getMovimientosCaja");
    }
};

const anularCobroController = async (req, res) => {
    const cobroId = parseInt(req.params.id);
    if (isNaN(cobroId)) return badRequest(res, "El ID del cobro debe ser un número válido");

    try {
        const data = await anularCobro(cobroId);
        return res.json({ success: true, ...data });
    } catch (err) {
        if (err.status) return res.status(err.status).json({ success: false, message: err.message });
        return serverError(res, err, "cajaController.anularCobro");
    }
};

module.exports = {
    generarCobroController,
    getCobrosController,
    getCobroController,
    registrarPagoController,
    getResumenPacienteController,
    getMovimientosCajaController,
    anularCobroController,
};
