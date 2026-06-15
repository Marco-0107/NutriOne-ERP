"use strict";

/**
 * Cálculos antropométricos (Sprint 4 — sección 4 del documento maestro).
 *
 * Todas las funciones son PURAS (entrada → salida, sin DB). Devuelven `null`
 * cuando faltan datos para que la capa superior muestre "N/D".
 *
 * Unidades de entrada (convención del módulo):
 *   peso kg · talla cm · perímetros cm · pliegues mm.
 * Las fórmulas que requieren metros convierten internamente (talla/100).
 */

const PI = Math.PI;

/** Redondea a `dec` decimales devolviendo Number (no string). */
const round = (x, dec = 2) =>
    (x === null || x === undefined || Number.isNaN(x)) ? null : Number(x.toFixed(dec));

/** Convierte cualquier representación de sexo a 'M' | 'F' | null. */
function normalizarSexo(sexo) {
    if (!sexo) return null;
    const s = String(sexo).trim().toLowerCase();
    if (["m", "masculino", "hombre", "varón", "varon"].includes(s)) return "M";
    if (["f", "femenino", "mujer"].includes(s)) return "F";
    return null; // "Otro" / "Prefiero no indicar" → cálculos por sexo no aplican
}

const num = (v) => {
    if (v === null || v === undefined || v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
};

// ─────────────────────────────────────────────────────────────────────────────
// 4.1 IMC (Índice de Quetelet) y su clasificación
// ─────────────────────────────────────────────────────────────────────────────

/** IMC = peso(kg) / talla(m)². Talla se recibe en cm. */
function calcularIMC(pesoKg, tallaCm) {
    const p = num(pesoKg), t = num(tallaCm);
    if (!p || !t) return null;
    const m = t / 100;
    return round(p / (m * m), 1);
}

/**
 * Clasifica el IMC según etapa.
 *  - adulto (18–64): cortes OMS.
 *  - adulto_mayor (≥65): cortes MINSAL.
 *  - pediátrico: requiere IMC/E con tablas (sección 9) → devuelve null aquí.
 */
function clasificarIMC(imc, etapa) {
    const v = num(imc);
    if (v === null) return null;

    if (etapa === "adulto_mayor") {
        if (v < 23.0) return "Bajo peso";
        if (v < 28.0) return "Normal";
        if (v < 32.0) return "Sobrepeso";
        return "Obesidad";
    }
    // adulto (y default para etapas sin tabla específica de cortes fijos)
    if (etapa === "adulto" || !etapa) {
        if (v < 18.5) return "Bajo peso";
        if (v < 25.0) return "Normal";
        if (v < 30.0) return "Sobrepeso";
        if (v < 35.0) return "Obesidad Tipo 1";
        if (v < 40.0) return "Obesidad Tipo 2";
        return "Obesidad Tipo 3";
    }
    return null; // pediátrico → IMC/E (Fase 5)
}

// ─────────────────────────────────────────────────────────────────────────────
// 4.2 Peso ideal / mínimo / máximo / meta
// ─────────────────────────────────────────────────────────────────────────────

/** IMC de referencia por etapa para peso ideal/min/max (sección 4.2). */
const IMC_REFERENCIA = {
    adulto:       { ideal: 21.7, min: 18.5, max: 24.9 },
    adulto_mayor: { ideal: 25.5, min: 23.1, max: 27.9 },
};

/**
 * Pesos de referencia: ideal, mínimo, máximo (y meta si se entrega imcMeta).
 * Peso = IMC_ref × talla(m)².
 */
function pesosReferencia(tallaCm, etapa, imcMeta = null) {
    const t = num(tallaCm);
    const ref = IMC_REFERENCIA[etapa] || IMC_REFERENCIA.adulto;
    if (!t) return { ideal: null, minimo: null, maximo: null, meta: null };
    const m2 = (t / 100) ** 2;
    return {
        ideal:  round(ref.ideal * m2, 1),
        minimo: round(ref.min * m2, 1),
        maximo: round(ref.max * m2, 1),
        meta:   num(imcMeta) ? round(num(imcMeta) * m2, 1) : null,
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4.3 Porcentaje de pérdida de peso (%PP)
// ─────────────────────────────────────────────────────────────────────────────

/** %PP = ((habitual − actual) / habitual) × 100. Solo si hay peso habitual. */
function porcentajePerdidaPeso(pesoHabitual, pesoActual) {
    const h = num(pesoHabitual), a = num(pesoActual);
    if (!h || !a) return null;
    return round(((h - a) / h) * 100, 1);
}

/**
 * Clasifica el %PP por periodo (sección 4.3).
 * @param {number} pp  porcentaje de pérdida (positivo = pérdida)
 * @param {('1s'|'1m'|'3m'|'6m')} periodo
 * @returns {('Sin pérdida significativa'|'Pérdida significativa'|'Pérdida severa'|null)}
 */
function clasificarPerdidaPeso(pp, periodo) {
    const v = num(pp);
    if (v === null) return null;
    if (v <= 0) return "Sin pérdida significativa";
    const cortes = { "1s": 2, "1m": 5, "3m": 7.5, "6m": 10 };
    const severo = cortes[periodo];
    if (severo === undefined) return null;
    if (v > severo) return "Pérdida severa";
    // umbral de "significativa": 1% en 1 semana, ~5/7.5/10 en el resto (igual al corte)
    const signif = periodo === "1s" ? 1 : severo;
    return v >= signif ? "Pérdida significativa" : "Sin pérdida significativa";
}

// ─────────────────────────────────────────────────────────────────────────────
// 4.4 Contextura (perímetro de muñeca)
// ─────────────────────────────────────────────────────────────────────────────

/** Índice de contextura = talla(cm) / perímetro muñeca(cm). */
function indiceContextura(tallaCm, perimetroMunecaCm) {
    const t = num(tallaCm), w = num(perimetroMunecaCm);
    if (!t || !w) return null;
    return round(t / w, 1);
}

function clasificarContextura(indice, sexo) {
    const v = num(indice), s = normalizarSexo(sexo);
    if (v === null || !s) return null;
    if (s === "M") {
        if (v > 10.4) return "Pequeña";
        if (v >= 9.6) return "Mediana";
        return "Grande";
    }
    if (v > 11.0) return "Pequeña";
    if (v >= 10.1) return "Mediana";
    return "Grande";
}

// ─────────────────────────────────────────────────────────────────────────────
// 4.5 Circunferencia de cuello (riesgo metabólico)
// ─────────────────────────────────────────────────────────────────────────────

function clasificarCuello(perimetroCuelloCm, sexo) {
    const v = num(perimetroCuelloCm), s = normalizarSexo(sexo);
    if (v === null || !s) return null;
    const corte = s === "M" ? 37 : 34;
    return v > corte ? "Riesgo metabólico" : "Sin riesgo";
}

// ─────────────────────────────────────────────────────────────────────────────
// 4.6 Perímetro de cintura (riesgo cardiovascular)
// ─────────────────────────────────────────────────────────────────────────────

function clasificarCintura(perimetroCinturaCm, sexo) {
    const v = num(perimetroCinturaCm), s = normalizarSexo(sexo);
    if (v === null || !s) return null;
    if (s === "M") {
        if (v < 88) return "Normal";
        if (v <= 102) return "Riesgo aumentado";
        return "Riesgo muy alto";
    }
    if (v < 80) return "Normal";
    if (v <= 88) return "Riesgo aumentado";
    return "Riesgo muy alto";
}

// ─────────────────────────────────────────────────────────────────────────────
// 4.7 Índice Cintura/Altura (ICA)
// ─────────────────────────────────────────────────────────────────────────────

/** ICA = cintura(cm) / talla(cm). */
function calcularICA(perimetroCinturaCm, tallaCm) {
    const c = num(perimetroCinturaCm), t = num(tallaCm);
    if (!c || !t) return null;
    return round(c / t, 2);
}

function clasificarICA(ica) {
    const v = num(ica);
    if (v === null) return null;
    return v <= 0.5 ? "Sin riesgo" : "Riesgo metabólico";
}

// ─────────────────────────────────────────────────────────────────────────────
// 4.8 Índice Cintura/Cadera (ICC) — Bray
// ─────────────────────────────────────────────────────────────────────────────

/** ICC = cintura(cm) / cadera(cm). */
function calcularICC(perimetroCinturaCm, perimetroCaderaCm) {
    const c = num(perimetroCinturaCm), h = num(perimetroCaderaCm);
    if (!c || !h) return null;
    return round(c / h, 3);
}

function clasificarICC(icc, sexo) {
    const v = num(icc), s = normalizarSexo(sexo);
    if (v === null || !s) return null;
    if (s === "M") {
        if (v < 0.78) return "Ginoide";
        if (v <= 0.94) return "Mixta";
        return "Androide";
    }
    if (v < 0.71) return "Ginoide";
    if (v <= 0.84) return "Mixta";
    return "Androide";
}

// ─────────────────────────────────────────────────────────────────────────────
// 4.9 Perímetro de pantorrilla (depleción proteica — clave en adulto mayor)
// ─────────────────────────────────────────────────────────────────────────────

function clasificarPantorrilla(perimetroPantorrillaCm) {
    const v = num(perimetroPantorrillaCm);
    if (v === null) return null;
    return v >= 31 ? "Sin depleción" : "Depleción de reservas proteicas";
}

// ─────────────────────────────────────────────────────────────────────────────
// 4.10 Reservas energéticas y proteicas braquiales (CMB, AMB, AB, AGB)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calcula reservas braquiales.
 * @param {number} perimetroBraquialCm  perímetro braquial (CB) en cm (UI) → se pasa a mm
 * @param {number} pliegueTricipitalMm  PCT en mm
 * @returns {{ cmb:number|null, amb:number|null, ab:number|null, agb:number|null }} en mm / mm²
 */
function reservasBraquiales(perimetroBraquialCm, pliegueTricipitalMm) {
    const pbCm = num(perimetroBraquialCm), pct = num(pliegueTricipitalMm);
    if (!pbCm || pct === null) return { cmb: null, amb: null, ab: null, agb: null };
    const pb = pbCm * 10; // mm

    const cmb = pb - PI * pct;          // mm
    const amb = (cmb * cmb) / (4 * PI); // mm²
    const ab  = (PI / 4) * ((pb / PI) ** 2); // mm²
    const agb = ab - amb;               // mm²

    return {
        cmb: round(cmb, 1),
        amb: round(amb, 1),
        ab:  round(ab, 1),
        agb: round(agb, 1),
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4.11 Porcentaje de grasa corporal
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A — Faulkner 1968. Σ4 = tricipital + subescapular + supraespinal + abdominal (mm).
 */
function grasaFaulkner({ tricipital, subescapular, supraespinal, abdominal }, sexo) {
    const t = num(tricipital), sb = num(subescapular), sp = num(supraespinal), ab = num(abdominal);
    const s = normalizarSexo(sexo);
    if ([t, sb, sp, ab].some((x) => x === null) || !s) return null;
    const sigma4 = t + sb + sp + ab;
    const pct = s === "M" ? 0.153 * sigma4 + 5.783 : 0.213 * sigma4 + 7.9;
    return round(pct, 1);
}

/** B — Siri a partir de densidad corporal D: %G = [(4.95/D) − 4.50] × 100. */
function grasaSiri(densidad) {
    const d = num(densidad);
    if (!d) return null;
    return round(((4.95 / d) - 4.50) * 100, 1);
}

/**
 * C — Slaughter (pediátrico) con pliegues tricipital (T) + subescapular (S) en mm.
 * @param {('prepuber'|'puber')} [maduracion='prepuber'] solo afecta a varones.
 */
function grasaSlaughter({ tricipital, subescapular }, sexo, maduracion = "prepuber") {
    const T = num(tricipital), S = num(subescapular);
    const sx = normalizarSexo(sexo);
    if (T === null || S === null || !sx) return null;
    const suma = T + S;
    let pct;
    if (suma <= 35) {
        if (sx === "M") {
            pct = maduracion === "puber"
                ? 1.21 * suma - 0.008 * suma * suma - 3.4
                : 1.21 * suma - 0.008 * suma * suma - 1.7;
        } else {
            pct = 1.33 * suma - 0.013 * suma * suma - 2.5;
        }
    } else {
        pct = sx === "M" ? 0.783 * suma + 1.6 : 0.546 * suma + 9.7;
    }
    return round(pct, 1);
}

/**
 * D — Densidad pediátrica (Brook 1971 / Lohman 1984) con 4 pliegues:
 * T (tricipital) + B (bicipital) + SB (subescapular) + SP (supraespinal/suprailíaco), en mm.
 * log = logaritmo base 10. %G = [(5.30/D) − 4.89] × 100.
 */
function grasaBrookLohman({ tricipital, bicipital, subescapular, supraespinal }, sexo) {
    const T = num(tricipital), B = num(bicipital), SB = num(subescapular), SP = num(supraespinal);
    const s = normalizarSexo(sexo);
    if ([T, B, SB, SP].some((x) => x === null) || !s) return null;
    const suma = T + B + SB + SP;
    if (suma <= 0) return null;
    const D = s === "M"
        ? 1.2063 - 0.0999 * Math.log10(suma)
        : 1.1690 - 0.0788 * Math.log10(suma);
    return round(((5.30 / D) - 4.89) * 100, 1);
}

/** Clasificación %grasa (Siri / MINSAL) — adulto. */
function clasificarGrasa(porcentaje, sexo) {
    const v = num(porcentaje), s = normalizarSexo(sexo);
    if (v === null || !s) return null;
    if (s === "M") {
        if (v < 10) return "Déficit";
        if (v <= 20) return "Normal";
        return "Exceso";
    }
    if (v < 20) return "Déficit";
    if (v <= 30) return "Normal";
    return "Exceso";
}

module.exports = {
    // helpers
    round,
    normalizarSexo,
    // 4.1
    calcularIMC,
    clasificarIMC,
    // 4.2
    IMC_REFERENCIA,
    pesosReferencia,
    // 4.3
    porcentajePerdidaPeso,
    clasificarPerdidaPeso,
    // 4.4
    indiceContextura,
    clasificarContextura,
    // 4.5
    clasificarCuello,
    // 4.6
    clasificarCintura,
    // 4.7
    calcularICA,
    clasificarICA,
    // 4.8
    calcularICC,
    clasificarICC,
    // 4.9
    clasificarPantorrilla,
    // 4.10
    reservasBraquiales,
    // 4.11
    grasaFaulkner,
    grasaSiri,
    grasaSlaughter,
    grasaBrookLohman,
    clasificarGrasa,
};
