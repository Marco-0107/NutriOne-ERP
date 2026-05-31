const { createUsuarioSchema, updateUsuarioSchema } = require("../validations/usuarioValidations");
const {
    getUsuariosService,
    createUsuarioService,
    updateUsuarioService,
    deleteUsuarioService,
} = require("../services/usuarioService");
const { badRequest, serverError } = require("../handlers/errorHandler");

const getUsuarios = async (req, res) => {
    try {
        const usuarios = await getUsuariosService();
        return res.json({ success: true, data: usuarios });
    } catch (err) {
        return serverError(res, err, "usuarioController.getUsuarios");
    }
};

const createUsuario = async (req, res) => {
    const { error, value } = createUsuarioSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const messages = [...new Set(error.details.map(d => d.message))].join(". ");
        return badRequest(res, messages);
    }

    try {
        const usuario = await createUsuarioService(value);
        return res.status(201).json({ success: true, data: usuario });
    } catch (err) {
        if (err.status) {
            return res.status(err.status).json({ success: false, message: err.message });
        }
        return serverError(res, err, "usuarioController.createUsuario");
    }
};

const updateUsuario = async (req, res) => {
    const usuarioId = parseInt(req.params.id);
    if (isNaN(usuarioId)) {
        return badRequest(res, "El ID del usuario debe ser un número válido");
    }

    const { error, value } = updateUsuarioSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const messages = [...new Set(error.details.map(d => d.message))].join(". ");
        return badRequest(res, messages);
    }

    try {
        const usuario = await updateUsuarioService(usuarioId, value);
        return res.json({ success: true, data: usuario });
    } catch (err) {
        if (err.status) {
            return res.status(err.status).json({ success: false, message: err.message });
        }
        return serverError(res, err, "usuarioController.updateUsuario");
    }
};

const deleteUsuario = async (req, res) => {
    const usuarioId = parseInt(req.params.id);
    if (isNaN(usuarioId)) {
        return badRequest(res, "El ID del usuario debe ser un número válido");
    }

    try {
        const result = await deleteUsuarioService(usuarioId);
        return res.json({ success: true, ...result });
    } catch (err) {
        if (err.status) {
            return res.status(err.status).json({ success: false, message: err.message });
        }
        return serverError(res, err, "usuarioController.deleteUsuario");
    }
};

module.exports = { getUsuarios, createUsuario, updateUsuario, deleteUsuario };
