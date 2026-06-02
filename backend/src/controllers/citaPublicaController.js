const { citaPublicaSchema, enviarOtpSchema, verificarOtpSchema } = require("../validations/citaValidations");
const {
    getNutricionistasPublicoService,
    getDisponibilidadPublicaService,
    agendarCitaPublicaService,
} = require("../services/citaPublicaService");
const { createOtp, verifyOtp, isPhoneVerified, consumeToken } = require("../services/otpService");
const { sendOtp, isMock } = require("../services/smsService");
const { validateRecaptcha } = require("../services/recaptchaService");
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

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const requestedDate = new Date(fecha + "T12:00:00");
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

const enviarOtp = async (req, res) => {
    const { error, value } = enviarOtpSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const messages = [...new Set(error.details.map(d => d.message))].join(". ");
        return badRequest(res, messages);
    }

    // Verify reCAPTCHA
    const captchaResult = await validateRecaptcha(value.recaptcha_token).catch(() => ({ valid: false, reason: "Error al verificar reCAPTCHA" }));
    if (!captchaResult.valid) {
        return res.status(403).json({ success: false, message: captchaResult.reason });
    }

    // Generate and send OTP
    const { otp, cooldownRemaining } = createOtp(value.telefono);
    if (cooldownRemaining > 0) {
        return res.status(429).json({
            success: false,
            message: `Espera ${cooldownRemaining} segundos antes de solicitar otro código`,
        });
    }

    const smsResult = await sendOtp(value.telefono, otp).catch((err) => {
        console.error("[SMS] Error sending OTP:", err.message);
        return null;
    });

    if (!smsResult) {
        return serverError(res, new Error("SMS send failed"), "citaPublicaController.enviarOtp");
    }

    const response = { success: true, message: "Código enviado al número indicado" };

    // In mock mode, include the OTP in the response for development/testing
    if (isMock) {
        response.dev_otp = otp;
        response.dev_notice = "MODO DESARROLLO: en producción este código solo llegaría por SMS";
    }

    return res.json(response);
};

const verificarOtp = async (req, res) => {
    const { error, value } = verificarOtpSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const messages = [...new Set(error.details.map(d => d.message))].join(". ");
        return badRequest(res, messages);
    }

    const result = verifyOtp(value.telefono, value.codigo);
    if (!result.valid) {
        return res.status(400).json({ success: false, message: result.reason });
    }

    return res.json({
        success: true,
        message: "Teléfono verificado correctamente",
        verification_token: result.token,
    });
};

const agendarCita = async (req, res) => {
    const { error, value } = citaPublicaSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const messages = [...new Set(error.details.map(d => d.message))].join(". ");
        return badRequest(res, messages);
    }

    // Verify phone was validated
    if (!isPhoneVerified(value.telefono, value.verification_token)) {
        return res.status(403).json({
            success: false,
            message: "El teléfono no ha sido verificado o el token ha expirado. Vuelve a verificar tu número",
        });
    }

    // Validate date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const requestedDate = new Date(value.fecha + "T12:00:00");
    if (requestedDate < today) {
        return badRequest(res, "No se pueden agendar citas en fechas pasadas");
    }

    try {
        const data = await agendarCitaPublicaService(value);
        consumeToken(value.telefono);
        return res.status(201).json({ success: true, data });
    } catch (err) {
        if (err.status) {
            return res.status(err.status).json({ success: false, message: err.message });
        }
        return serverError(res, err, "citaPublicaController.agendarCita");
    }
};

module.exports = { getNutricionistas, getDisponibilidad, enviarOtp, verificarOtp, agendarCita };
