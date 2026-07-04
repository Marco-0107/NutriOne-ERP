"use strict";
const { resumenFinancieroSchema } = require("../validations/dashboardValidations");
const { getResumenFinanciero, getResumenAgenda } = require("../services/dashboardService");
const { badRequest, serverError } = require("../handlers/errorHandler");

const getResumenFinancieroController = async (req, res) => {
    const { error, value } = resumenFinancieroSchema.validate(req.query, { abortEarly: false });
    if (error) {
        const messages = [...new Set(error.details.map((d) => d.message))].join(". ");
        return badRequest(res, messages);
    }

    try {
        const data = await getResumenFinanciero(value);
        return res.json({ success: true, data });
    } catch (err) {
        if (err.status) return res.status(err.status).json({ success: false, message: err.message });
        return serverError(res, err, "dashboardController.getResumenFinanciero");
    }
};

const getResumenAgendaController = async (req, res) => {
    try {
        const data = await getResumenAgenda();
        return res.json({ success: true, data });
    } catch (err) {
        if (err.status) return res.status(err.status).json({ success: false, message: err.message });
        return serverError(res, err, "dashboardController.getResumenAgenda");
    }
};

module.exports = {
    getResumenFinancieroController,
    getResumenAgendaController,
};
