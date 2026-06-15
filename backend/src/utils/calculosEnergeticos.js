"use strict";

/**
 * Requerimiento energético y distribución de macronutrientes
 * (Sprint 4 — secciones 5 y 6 del documento maestro).
 *
 * Flujo:  GEB (FAO/OMS/UNU 2004)  →  GET = GEB × PAL [× FP]  →  reparto en macros.
 * GEB y GET se devuelven por separado (son datos clínicos distintos).
 */

const { normalizarSexo, round } = require("./calculosAntropometricos");
const { rangosPorEtapa } = require("./referencias/rangosMacronutrientes");

const num = (v) => {
    if (v === null || v === undefined || v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
};

// ─────────────────────────────────────────────────────────────────────────────
// 5.2 GEB — FAO/OMS/UNU 2004 (kcal/día). Coeficientes por tramo de edad y sexo.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Coeficientes GEB = a × peso + b. Tramos: 18–29, 30–59, ≥60
 * (se usa el corte FAO convencional ≥60 para el tercer tramo).
 */
const COEF_GEB = {
    M: [
        { maxEdad: 29, a: 15.057, b: 692.2 },
        { maxEdad: 59, a: 11.472, b: 873.1 },
        { maxEdad: Infinity, a: 11.711, b: 587.7 },
    ],
    F: [
        { maxEdad: 29, a: 14.818, b: 486.6 },
        { maxEdad: 59, a: 8.126, b: 845.6 },
        { maxEdad: Infinity, a: 9.082, b: 658.5 },
    ],
};

/**
 * Gasto Energético Basal (FAO 2004).
 * Solo definido para ≥18 años (el documento entrega coeficientes adultos).
 * Para edades pediátricas devuelve null (requiere ecuaciones específicas no incluidas).
 * @returns {number|null} kcal/día
 */
function calcularGEB({ pesoKg, edadAnios, sexo }) {
    const p = num(pesoKg), edad = num(edadAnios), s = normalizarSexo(sexo);
    if (!p || edad === null || !s) return null;
    if (edad < 18) return null; // fuera de la tabla FAO adulta del documento
    const tramo = COEF_GEB[s].find((t) => edad <= t.maxEdad);
    return round(tramo.a * p + tramo.b, 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// 5.3 PAL — Factor de Actividad Física
// ─────────────────────────────────────────────────────────────────────────────

const PAL_CATEGORIAS = {
    sedentario: { min: 1.40, max: 1.69, sugerido: 1.55, etiqueta: "Sedentario" },
    moderado:   { min: 1.70, max: 1.99, sugerido: 1.85, etiqueta: "Activo / Moderado" },
    vigoroso:   { min: 2.00, max: 2.40, sugerido: 2.20, etiqueta: "Vigoroso" },
};

/** Devuelve el PAL representativo de una categoría. */
function palSugerido(categoria) {
    return PAL_CATEGORIAS[categoria]?.sugerido ?? null;
}

/** Valida que un PAL esté dentro del rango de su categoría. */
function palEnRango(pal, categoria) {
    const v = num(pal), cat = PAL_CATEGORIAS[categoria];
    if (v === null || !cat) return false;
    return v >= cat.min && v <= cat.max;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5.1 / 5.4 GET — Gasto Energético Total
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET = GEB × PAL [× FP].
 * @param {number} geb  kcal/día
 * @param {number} pal  factor actividad
 * @param {number} [fp] factor patología (solo hospitalizados)
 * @returns {number|null} kcal/día
 */
function calcularGET(geb, pal, fp = null) {
    const g = num(geb), p = num(pal), f = num(fp);
    if (!g || !p) return null;
    const total = f ? g * p * f : g * p;
    return round(total, 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// 6.2 Distribución de macronutrientes (gramos) + validación de la regla del 100%
// ─────────────────────────────────────────────────────────────────────────────

const KCAL_POR_GRAMO = { pro: 4, cho: 4, lip: 9 };

/**
 * Valida la distribución de macros: la suma debe ser EXACTAMENTE 100%.
 * @returns {{ valido:boolean, suma:number, mensaje:string|null }}
 */
function validarDistribucionMacros({ proPct, choPct, lipPct }) {
    const pro = num(proPct) ?? 0, cho = num(choPct) ?? 0, lip = num(lipPct) ?? 0;
    const suma = round(pro + cho + lip, 1);
    if (suma !== 100) {
        return { valido: false, suma, mensaje: `La suma de macronutrientes debe ser 100% (actual: ${suma}%).` };
    }
    return { valido: true, suma, mensaje: null };
}

/**
 * Calcula los gramos de cada macronutriente a partir del GET y los %.
 *   g PRO = GET×%/4 · g CHO = GET×%/4 · g LIP = GET×%/9
 * @returns {{ pro:{pct,gramos,kcal}, cho:{...}, lip:{...} } | null}
 */
function calcularMacros(get, { proPct, choPct, lipPct }) {
    const g = num(get);
    if (!g) return null;
    const calc = (pct, tipo) => {
        const p = num(pct);
        if (p === null) return { pct: null, gramos: null, kcal: null };
        const kcal = g * (p / 100);
        return { pct: p, gramos: round(kcal / KCAL_POR_GRAMO[tipo], 1), kcal: round(kcal, 0) };
    };
    return { pro: calc(proPct, "pro"), cho: calc(choPct, "cho"), lip: calc(lipPct, "lip") };
}

/**
 * Verifica que cada macro esté dentro del rango permitido para la etapa (6.1).
 * @returns {{ pro:boolean, cho:boolean, lip:boolean }}
 */
function macrosEnRango({ proPct, choPct, lipPct }, etapa) {
    const r = rangosPorEtapa(etapa);
    const dentro = (v, [lo, hi]) => {
        const n = num(v);
        return n !== null && n >= lo && n <= hi;
    };
    return {
        pro: dentro(proPct, r.pro),
        cho: dentro(choPct, r.cho),
        lip: dentro(lipPct, r.lip),
    };
}

module.exports = {
    COEF_GEB,
    calcularGEB,
    PAL_CATEGORIAS,
    palSugerido,
    palEnRango,
    calcularGET,
    KCAL_POR_GRAMO,
    validarDistribucionMacros,
    calcularMacros,
    macrosEnRango,
};
