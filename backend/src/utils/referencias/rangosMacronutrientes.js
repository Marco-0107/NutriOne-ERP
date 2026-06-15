"use strict";

/**
 * Rangos de distribución de macronutrientes por etapa del ciclo vital
 * (Sprint 4 — sección 6.1). Porcentajes del total energético (GET).
 *
 * Regla crítica: el clínico elige el % de cada macro dentro de su rango,
 * pero PRO + CHO + LIP debe sumar EXACTAMENTE 100% (se valida aparte).
 */

const RANGOS_MACROS = {
    adulto:         { pro: [10, 15], cho: [50, 60], lip: [20, 30] },
    adulto_mayor:   { pro: [15, 20], cho: [50, 60], lip: [20, 35] },
    embarazada:     { pro: [10, 20], cho: [50, 60], lip: [25, 30] },
    nodriza:        { pro: [10, 20], cho: [50, 60], lip: [25, 30] },
    // "Lactante hasta 6 meses" y "hasta 1 año": el documento subdivide para macros.
    lactante_menor: { pro: [7, 10],  cho: [50, 60], lip: [30, 45] }, // rango amplio que cubre <6m y <1a
    lactante_mayor: { pro: [7, 10],  cho: [50, 60], lip: [30, 35] },
    preescolar:     { pro: [10, 12], cho: [50, 60], lip: [30, 35] },
    escolar:        { pro: [12, 15], cho: [50, 65], lip: [30, 35] },
    adolescente:    { pro: [15, 15], cho: [55, 60], lip: [25, 30] },
};

/** Valor por defecto sugerido por etapa (punto medio del rango, ajustado a sumar ~100). */
function sugeridoMacros(etapa) {
    const r = RANGOS_MACROS[etapa] || RANGOS_MACROS.adulto;
    // proteína y lípido en su punto medio; carbohidrato completa hasta 100.
    const pro = Math.round((r.pro[0] + r.pro[1]) / 2);
    const lip = Math.round((r.lip[0] + r.lip[1]) / 2);
    const cho = 100 - pro - lip;
    return { pro, cho, lip };
}

/** Devuelve el rango por etapa (default adulto). */
function rangosPorEtapa(etapa) {
    return RANGOS_MACROS[etapa] || RANGOS_MACROS.adulto;
}

module.exports = { RANGOS_MACROS, sugeridoMacros, rangosPorEtapa };
