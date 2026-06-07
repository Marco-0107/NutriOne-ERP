/**
 * SMS Service — mock mode for development, Twilio for production.
 *
 * Set SMS_MOCK_MODE=true in .env to skip real SMS and return the OTP in the response.
 * For production: set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER.
 */

const isMock = process.env.SMS_MOCK_MODE === "true";

const sendOtp = async (phone, otp) => {
    if (isMock) {
        console.log(`[SMS MOCK] Teléfono: ${phone} | Código OTP: ${otp}`);
        return { mock: true, otp };
    }

    // Production: Twilio
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken  = process.env.TWILIO_AUTH_TOKEN;
    const from       = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !from) {
        throw new Error("Twilio credentials not configured in environment variables");
    }

    const twilio = require("twilio")(accountSid, authToken);

    await twilio.messages.create({
        body: `Tu código de verificación NutriOne es: ${otp}. Válido por 5 minutos.`,
        from,
        to: phone,
    });

    return { mock: false };
};

module.exports = { sendOtp, isMock };
