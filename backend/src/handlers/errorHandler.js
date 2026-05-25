/**
 * Handler centralizado de errores HTTP
 *
 * Proporciona respuestas estandarizadas para errores comunes
 * y errores inesperados del servidor, evitando repetir lógica
 * de error en cada controlador.
 */

/**
 * Retorna una respuesta de error 400 Bad Request.
 * @param {Response} res - Objeto response de Express
 * @param {string} message - Mensaje descriptivo del error
 */
const badRequest = (res, message) =>
    res.status(400).json({ success: false, message });

/**
 * Retorna una respuesta de error 401 Unauthorized.
 * @param {Response} res - Objeto response de Express
 * @param {string} message - Mensaje descriptivo del error
 */
const unauthorized = (res, message = "No autorizado") =>
    res.status(401).json({ success: false, message });

/**
 * Retorna una respuesta de error 403 Forbidden.
 * @param {Response} res - Objeto response de Express
 * @param {string} message - Mensaje descriptivo del error
 */
const forbidden = (res, message = "Acceso denegado") =>
    res.status(403).json({ success: false, message });

/**
 * Retorna una respuesta de error 404 Not Found.
 * @param {Response} res - Objeto response de Express
 * @param {string} resource - Nombre del recurso no encontrado
 */
const notFound = (res, resource = "Recurso") =>
    res.status(404).json({ success: false, message: `${resource} no encontrado` });

/**
 * Retorna una respuesta de error 409 Conflict (recurso duplicado).
 * @param {Response} res - Objeto response de Express
 * @param {string} message - Mensaje descriptivo del conflicto
 */
const conflict = (res, message) =>
    res.status(409).json({ success: false, message });

/**
 * Maneja errores internos del servidor (500).
 * Registra el error en consola y retorna un mensaje genérico.
 *
 * @param {Response} res        - Objeto response de Express
 * @param {Error}    error      - Objeto de error capturado
 * @param {string}   context    - Contexto del error (para el log)
 */
const serverError = (res, error, context = "Servidor") => {
    console.error(`[Error][${context}]`, error);
    return res.status(500).json({
        success: false,
        message: "Error interno del servidor. Por favor, intente más tarde."
    });
};

module.exports = {
    badRequest,
    unauthorized,
    forbidden,
    notFound,
    conflict,
    serverError
};
