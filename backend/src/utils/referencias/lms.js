"use strict";

/**
 * Motor LMS / Z-score (Sprint 4 — sección 9).
 *
 * Las curvas de la OMS (2006/2007) y otras referencias pediátricas se publican
 * con el método LMS: para cada edad/sexo se entregan tres parámetros
 *   L = potencia de Box-Cox (asimetría), M = mediana, S = coef. de variación.
 *
 * Dado un valor X (peso, talla, IMC, perímetro cefálico…) se obtiene:
 *   Z = ((X/M)^L − 1) / (L·S)     si L ≠ 0
 *   Z =  ln(X/M) / S              si L = 0
 *
 * Este módulo es PURO: solo matemática. Los datos (tablas L,M,S) se cargan
 * aparte desde backend/src/data/ (ver antropometriaPediatrica.js y data/README.md).
 */

/** Z-score por método LMS. */
function zScoreLMS(x, { L, M, S }) {
    if (![x, L, M, S].every(Number.isFinite) || M <= 0 || S <= 0) return null;
    const z = L === 0 ? Math.log(x / M) / S : (Math.pow(x / M, L) - 1) / (L * S);
    return Number.isFinite(z) ? Number(z.toFixed(2)) : null;
}

/** Función de error (Abramowitz & Stegun 7.1.26) para el CDF normal. */
function erf(x) {
    const sign = x < 0 ? -1 : 1;
    const ax = Math.abs(x);
    const t = 1 / (1 + 0.3275911 * ax);
    const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-ax * ax);
    return sign * y;
}

/** Percentil (0–100) a partir de un Z-score, vía CDF normal estándar. */
function percentilDesdeZ(z) {
    if (z === null || !Number.isFinite(z)) return null;
    const p = 0.5 * (1 + erf(z / Math.SQRT2)) * 100;
    return Number(p.toFixed(1));
}

/**
 * Interpola linealmente los parámetros {L,M,S} para un valor de x (edad o talla)
 * dentro de una tabla ordenada [{ x, L, M, S }, ...].
 * @returns {{L,M,S}|null} null si x está fuera del rango cubierto por la tabla.
 */
function interpolarLMS(tabla, x) {
    if (!Array.isArray(tabla) || tabla.length === 0 || !Number.isFinite(x)) return null;
    // exacto o extremos
    if (x <= tabla[0].x) return x === tabla[0].x ? pick(tabla[0]) : null;
    const ultimo = tabla[tabla.length - 1];
    if (x >= ultimo.x) return x === ultimo.x ? pick(ultimo) : null;

    for (let i = 0; i < tabla.length - 1; i++) {
        const a = tabla[i], b = tabla[i + 1];
        if (x >= a.x && x <= b.x) {
            const f = (x - a.x) / (b.x - a.x);
            return {
                L: a.L + f * (b.L - a.L),
                M: a.M + f * (b.M - a.M),
                S: a.S + f * (b.S - a.S),
            };
        }
    }
    return null;
}

const pick = ({ L, M, S }) => ({ L, M, S });

/**
 * Clasificación por Z-score (DE) según los cortes oficiales MINSAL Chile.
 * Bandas: ≤-2 / (-2,-1] / (-1,+1) / [+1,+2) / [+2,+3) / ≥+3.
 * @param {number} z
 * @param {('peso_edad'|'talla_edad'|'peso_talla'|'imc_edad'|'pce_edad')} indicador
 */
function clasificarZ(z, indicador) {
    if (z === null || !Number.isFinite(z)) return null;
    switch (indicador) {
        case "peso_edad": // P/E (déficit por P/E; el exceso se califica con P/T)
            if (z <= -2) return "Desnutrición";
            if (z <= -1) return "Riesgo de desnutrir";
            if (z < 1) return "Normal";
            return "Evaluar con P/T";
        case "talla_edad": // T/E (calificación estatural)
            if (z <= -2) return "Talla baja";
            if (z <= -1) return "Talla normal baja";
            if (z < 1) return "Normal";
            if (z < 2) return "Talla normal alta";
            return "Talla alta";
        case "peso_talla": // P/T
            if (z <= -2) return "Desnutrición";
            if (z <= -1) return "Riesgo de desnutrir";
            if (z < 1) return "Normal";
            if (z < 2) return "Sobrepeso";
            return "Obesidad";
        case "imc_edad": // IMC/E (>5 años; incluye obesidad severa ≥+3DE)
            if (z <= -2) return "Desnutrición";
            if (z <= -1) return "Riesgo de desnutrir";
            if (z < 1) return "Normal";
            if (z < 2) return "Sobrepeso";
            if (z < 3) return "Obesidad";
            return "Obesidad severa";
        case "pce_edad": // PCe/E (no tabulado en el manual MINSAL; soportado si se carga)
            if (z < -2) return "Microcefalia";
            if (z <= 2) return "Normal";
            return "Macrocefalia";
        default:
            return null;
    }
}

module.exports = { zScoreLMS, percentilDesdeZ, interpolarLMS, clasificarZ, erf };
