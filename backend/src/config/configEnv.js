"use strict";
const path    = require("path");
const dotenv  = require("dotenv");

// Apunta siempre al .env que está en la raíz del backend
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

/**
 * Valida y exporta una variable de entorno.
 * Si no existe, lanza un error fatal que detiene el proceso.
 */
function requireEnv(key) {
    const value = process.env[key];
    if (!value || value.trim() === "") {
        console.error(`\n[FATAL] Variable de entorno '${key}' no definida en el archivo .env.\n`);
        process.exit(1);
    }
    return value.trim();
}

// ── Base de datos ──────────────────────────────────────────
const DB_HOST     = requireEnv("DB_HOST");
const DB_PORT     = parseInt(requireEnv("DB_PORT"), 10);
const DB_USERNAME = requireEnv("DB_USERNAME");
const DB_PASSWORD = requireEnv("DB_PASSWORD");
const DATABASE    = requireEnv("DATABASE");

// ── Servidor ───────────────────────────────────────────────
const HOST = requireEnv("HOST");
const PORT = parseInt(requireEnv("PORT"), 10);

// ── Seguridad ──────────────────────────────────────────────
const ACCESS_TOKEN_SECRET = requireEnv("ACCESS_TOKEN_SECRET");
const COOKIE_KEY          = requireEnv("COOKIE_KEY");

module.exports = {
    DB_HOST,
    DB_PORT,
    DB_USERNAME,
    DB_PASSWORD,
    DATABASE,
    HOST,
    PORT,
    ACCESS_TOKEN_SECRET,
    COOKIE_KEY,
};
