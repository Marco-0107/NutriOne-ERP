const {
    enviarOtpEvolucionSchema,
    verificarOtpEvolucionSchema,
    consultarEvolucionSchema,
} = require("../validations/evolucionPublicaValidations");
const { validarRutYTelefonoService, getEvolucionPublicaService } = require("../services/evolucionPublicaService");
const { createOtp, verifyOtp, isPhoneVerified } = require("../services/otpService");
const { sendOtp, isMock } = require("../services/smsService");
const { validateRecaptcha } = require("../services/recaptchaService");
const { badRequest, serverError } = require("../handlers/errorHandler");

const enviarOtp = async (req, res) => {
    const { error, value } = enviarOtpEvolucionSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const messages = [...new Set(error.details.map(d => d.message))].join(". ");
        return badRequest(res, messages);
    }

    const captchaResult = await validateRecaptcha(value.recaptcha_token).catch(() => ({ valid: false, reason: "Error al verificar reCAPTCHA" }));
    if (!captchaResult.valid) {
        return res.status(403).json({ success: false, message: captchaResult.reason });
    }

    try {
        // Valida que el RUT exista y que el teléfono coincida con el registrado ANTES de enviar el SMS.
        await validarRutYTelefonoService(value.rut, value.telefono);
    } catch (err) {
        if (err.status) return res.status(err.status).json({ success: false, message: err.message });
        return serverError(res, err, "evolucionPublicaController.enviarOtp");
    }

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
        return serverError(res, new Error("SMS send failed"), "evolucionPublicaController.enviarOtp");
    }

    const response = { success: true, message: "Código enviado al número indicado" };

    if (isMock) {
        response.dev_otp = otp;
        response.dev_notice = "MODO DESARROLLO: en producción este código solo llegaría por SMS";
    }

    return res.json(response);
};

const verificarOtp = async (req, res) => {
    const { error, value } = verificarOtpEvolucionSchema.validate(req.body, { abortEarly: false });
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

const consultar = async (req, res) => {
    const { error, value } = consultarEvolucionSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const messages = [...new Set(error.details.map(d => d.message))].join(". ");
        return badRequest(res, messages);
    }

    if (!isPhoneVerified(value.telefono, value.verification_token)) {
        return res.status(403).json({
            success: false,
            message: "El teléfono no ha sido verificado o el código de sesión expiró. Vuelve a verificar tu número",
        });
    }

    try {
        const data = await getEvolucionPublicaService(value.rut, value.telefono);
        return res.json({ success: true, data });
    } catch (err) {
        if (err.status) return res.status(err.status).json({ success: false, message: err.message });
        return serverError(res, err, "evolucionPublicaController.consultar");
    }
};

module.exports = { enviarOtp, verificarOtp, consultar };
