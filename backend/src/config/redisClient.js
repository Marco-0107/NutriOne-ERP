"use strict";
const { createClient } = require("redis");
const {
    REDIS_HOST,
    REDIS_PORT,
    REDIS_PASSWORD,
    REDIS_DB
} = require("./configEnv");

/**
 * Cliente Redis (singleton)
 *
 * Se usa para cachear los permisos resueltos de cada usuario y evitar
 * golpear la base de datos en cada request del authMiddleware.
 *
 * Diseño defensivo: si Redis no está disponible, el cliente queda en
 * estado "no conectado" y los helpers retornan null sin lanzar. El
 * sistema sigue funcionando contra la BD (cache opcional).
 */

const redisClient = createClient({
    socket: {
        host: REDIS_HOST,
        port: REDIS_PORT,
        // Reintenta máximo 5 veces; luego deja de intentar y queda offline.
        reconnectStrategy: (retries) => {
            if (retries > 5) return false;
            return Math.min(retries * 200, 2000);
        }
    },
    password: REDIS_PASSWORD || undefined,
    database: REDIS_DB
});

redisClient.on("error", (err) => {
    // Solo loggeamos: no tumbamos la app por una caída de Redis.
    if (err && err.code !== "ECONNREFUSED") {
        console.error("[Redis] Error:", err.message);
    }
});

redisClient.on("connect", () => {
    console.log("=> Conexión exitosa a Redis!");
});

redisClient.on("end", () => {
    console.log("[Redis] Conexión cerrada");
});

/**
 * Intenta conectar Redis al iniciar la app. No bloquea el arranque
 * si Redis está caído: solo loggea y continúa sin caché.
 */
const connectRedis = async () => {
    try {
        await redisClient.connect();
    } catch (err) {
        console.warn("[Redis] No fue posible conectar:", err.message);
        console.warn("[Redis] La app seguirá funcionando sin caché de permisos.");
    }
};

/** True solo si Redis está listo para recibir comandos */
const isRedisReady = () => redisClient.isReady;

module.exports = {
    redisClient,
    connectRedis,
    isRedisReady
};
