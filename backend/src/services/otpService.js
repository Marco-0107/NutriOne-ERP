const crypto = require("crypto");

// In-memory store: phone -> { otp, expiresAt, attempts, lastSentAt, verifiedToken }
const otpStore = new Map();

const OTP_TTL_MS       = 5 * 60 * 1000;  // 5 minutes
const MAX_ATTEMPTS     = 3;
const RESEND_COOLDOWN  = 60 * 1000;       // 1 minute between sends
const TOKEN_TTL_MS     = 15 * 60 * 1000; // verified token valid for 15 min

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const generateToken = () => crypto.randomBytes(32).toString("hex");

/**
 * Create and store a new OTP for the given phone.
 * Returns { otp, cooldownRemaining } where cooldownRemaining > 0 means rate-limited.
 */
const createOtp = (phone) => {
    const now = Date.now();
    const existing = otpStore.get(phone);

    if (existing && existing.lastSentAt) {
        const elapsed = now - existing.lastSentAt;
        if (elapsed < RESEND_COOLDOWN) {
            return { otp: null, cooldownRemaining: Math.ceil((RESEND_COOLDOWN - elapsed) / 1000) };
        }
    }

    const otp = generateOtp();
    otpStore.set(phone, {
        otp,
        expiresAt: now + OTP_TTL_MS,
        attempts: 0,
        lastSentAt: now,
        verifiedToken: null,
    });

    return { otp, cooldownRemaining: 0 };
};

/**
 * Verify an OTP for the given phone.
 * Returns { valid, reason, token } where token is set on success.
 */
const verifyOtp = (phone, code) => {
    const entry = otpStore.get(phone);

    if (!entry) {
        return { valid: false, reason: "No hay un código pendiente para este teléfono" };
    }

    if (Date.now() > entry.expiresAt) {
        otpStore.delete(phone);
        return { valid: false, reason: "El código ha expirado. Solicita uno nuevo" };
    }

    if (entry.attempts >= MAX_ATTEMPTS) {
        otpStore.delete(phone);
        return { valid: false, reason: "Demasiados intentos fallidos. Solicita un nuevo código" };
    }

    if (entry.otp !== code) {
        entry.attempts += 1;
        const remaining = MAX_ATTEMPTS - entry.attempts;
        return {
            valid: false,
            reason: remaining > 0
                ? `Código incorrecto. Te quedan ${remaining} intento(s)`
                : "Código incorrecto. No quedan más intentos",
        };
    }

    // Success: generate a short-lived verification token
    const token = generateToken();
    otpStore.set(phone, {
        ...entry,
        otp: null,
        verifiedToken: token,
        verifiedAt: Date.now(),
        tokenExpiresAt: Date.now() + TOKEN_TTL_MS,
    });

    return { valid: true, token };
};

/**
 * Check if a phone has a valid verification token (used before booking).
 */
const isPhoneVerified = (phone, token) => {
    const entry = otpStore.get(phone);
    if (!entry || !entry.verifiedToken) return false;
    if (Date.now() > entry.tokenExpiresAt) {
        otpStore.delete(phone);
        return false;
    }
    return entry.verifiedToken === token;
};

/**
 * Consume (invalidate) the verification token after booking.
 */
const consumeToken = (phone) => {
    otpStore.delete(phone);
};

// Cleanup expired entries every 10 minutes
setInterval(() => {
    const now = Date.now();
    for (const [phone, entry] of otpStore.entries()) {
        const expiry = entry.tokenExpiresAt || entry.expiresAt;
        if (now > expiry) otpStore.delete(phone);
    }
}, 10 * 60 * 1000);

module.exports = { createOtp, verifyOtp, isPhoneVerified, consumeToken };
