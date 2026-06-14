"use strict";
const { redisClient, isRedisReady } = require("../config/redisClient");

/**
 * Servicio de Caché de Permisos
 *
 * Guarda en Redis el payload de usuario (roles + permisos) resuelto
 * tras consultar la BD, indexado por id de usuario.
 *
 * Clave: permisos:user:<id>
 * Valor: JSON con { id, rut, nombres, ..., permisos, roles }
 * TTL:   1 hora
 *
 * Si Redis no está disponible, todas las funciones se comportan como
 * miss/no-op para no romper el flujo principal.
 */

const TTL_SEGUNDOS = 60 * 60; // 1 hora
const keyUser = (userId) => `permisos:user:${userId}`;

const getUserPayloadFromCache = async (userId) => {
    if (!isRedisReady()) return null;
    try {
        const raw = await redisClient.get(keyUser(userId));
        return raw ? JSON.parse(raw) : null;
    } catch (err) {
        console.warn("[CachePermisos] GET falló:", err.message);
        return null;
    }
};

const setUserPayloadInCache = async (userId, payload) => {
    if (!isRedisReady()) return;
    try {
        await redisClient.set(
            keyUser(userId),
            JSON.stringify(payload),
            { EX: TTL_SEGUNDOS }
        );
    } catch (err) {
        console.warn("[CachePermisos] SET falló:", err.message);
    }
};

/** Invalida el caché de un usuario (cambio de roles asignados). */
const invalidateUserCache = async (userId) => {
    if (!isRedisReady()) return;
    try {
        await redisClient.del(keyUser(userId));
    } catch (err) {
        console.warn("[CachePermisos] DEL falló:", err.message);
    }
};

/** Invalida varios usuarios (cambio de permisos de un rol). */
const invalidateManyUsersCache = async (userIds = []) => {
    if (!isRedisReady() || userIds.length === 0) return;
    try {
        const keys = userIds.map(keyUser);
        await redisClient.del(keys);
    } catch (err) {
        console.warn("[CachePermisos] DEL múltiple falló:", err.message);
    }
};

module.exports = {
    getUserPayloadFromCache,
    setUserPayloadInCache,
    invalidateUserCache,
    invalidateManyUsersCache
};
