const { createPacienteSchema, updatePacienteSchema } = require("../validations/pacienteValidations");
const {
    getPacientesService,
    createPacienteService,
    updatePacienteService,
    deletePacienteService,
} = require("../services/pacienteService");
const { badRequest, serverError } = require("../handlers/errorHandler");

const getPacientes = async (req, res) => {
    try {
        const pacientes = await getPacientesService();
        return res.json({ success: true, data: pacientes });
    } catch (err) {
        return serverError(res, err, "pacienteController.getPacientes");
    }
};

const createPaciente = async (req, res) => {
    const { error, value } = createPacienteSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const messages = [...new Set(error.details.map(d => d.message))].join(". ");
        return badRequest(res, messages);
    }

    try {
        const paciente = await createPacienteService(value);
        return res.status(201).json({ success: true, data: paciente });
    } catch (err) {
        if (err.status) {
            return res.status(err.status).json({ success: false, message: err.message });
        }
        return serverError(res, err, "pacienteController.createPaciente");
    }
};

const updatePaciente = async (req, res) => {
    const pacienteId = parseInt(req.params.id);
    if (isNaN(pacienteId)) {
        return badRequest(res, "El ID del paciente debe ser un número válido");
    }

    const { error, value } = updatePacienteSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const messages = [...new Set(error.details.map(d => d.message))].join(". ");
        return badRequest(res, messages);
    }

    try {
        const paciente = await updatePacienteService(pacienteId, value);
        return res.json({ success: true, data: paciente });
    } catch (err) {
        if (err.status) {
            return res.status(err.status).json({ success: false, message: err.message });
        }
        return serverError(res, err, "pacienteController.updatePaciente");
    }
};

const deletePaciente = async (req, res) => {
    const pacienteId = parseInt(req.params.id);
    if (isNaN(pacienteId)) {
        return badRequest(res, "El ID del paciente debe ser un número válido");
    }

    try {
        const result = await deletePacienteService(pacienteId);
        return res.json({ success: true, ...result });
    } catch (err) {
        if (err.status) {
            return res.status(err.status).json({ success: false, message: err.message });
        }
        return serverError(res, err, "pacienteController.deletePaciente");
    }
};

module.exports = { getPacientes, createPaciente, updatePaciente, deletePaciente };
