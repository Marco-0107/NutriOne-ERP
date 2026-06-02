const https = require("https");
const querystring = require("querystring");

const RECAPTCHA_SECRET  = process.env.RECAPTCHA_SECRET_KEY;
const MIN_SCORE         = parseFloat(process.env.RECAPTCHA_MIN_SCORE || "0.5");
const MOCK_MODE         = process.env.RECAPTCHA_MOCK_MODE === "true";

/**
 * Verify a reCAPTCHA v3 token with Google's API.
 * Returns { success, score, action } or throws on network error.
 */
const verifyRecaptcha = (token) => {
    if (MOCK_MODE) {
        console.log("[RECAPTCHA MOCK] Skipping verification, returning score 1.0");
        return Promise.resolve({ success: true, score: 1.0, action: "mock" });
    }

    return new Promise((resolve, reject) => {
        const body = querystring.stringify({
            secret:   RECAPTCHA_SECRET,
            response: token,
        });

        const options = {
            hostname: "www.google.com",
            path:     "/recaptcha/api/siteverify",
            method:   "POST",
            headers: {
                "Content-Type":   "application/x-www-form-urlencoded",
                "Content-Length": Buffer.byteLength(body),
            },
        };

        const req = https.request(options, (res) => {
            let data = "";
            res.on("data", (chunk) => { data += chunk; });
            res.on("end", () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve(parsed);
                } catch {
                    reject(new Error("Invalid response from reCAPTCHA API"));
                }
            });
        });

        req.on("error", reject);
        req.write(body);
        req.end();
    });
};

/**
 * Validate recaptcha token and enforce minimum score.
 * Returns { valid, reason }.
 */
const validateRecaptcha = async (token) => {
    if (!token) {
        return { valid: false, reason: "Token de reCAPTCHA requerido" };
    }

    if (!RECAPTCHA_SECRET && !MOCK_MODE) {
        console.warn("[RECAPTCHA] RECAPTCHA_SECRET_KEY not set — skipping verification");
        return { valid: true };
    }

    const result = await verifyRecaptcha(token);

    if (!result.success) {
        return { valid: false, reason: "Verificación reCAPTCHA fallida. Recarga la página e intenta de nuevo" };
    }

    if (typeof result.score === "number" && result.score < MIN_SCORE) {
        return { valid: false, reason: "Actividad sospechosa detectada. Intenta de nuevo más tarde" };
    }

    return { valid: true };
};

module.exports = { validateRecaptcha };
