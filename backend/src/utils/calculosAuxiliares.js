"use strict";

/**
 * Cálculos auxiliares (Sprint 4 — sección 8 del documento maestro):
 * edades, estimación de talla/peso para pacientes sin bipedestación (postrados),
 * estimación de peso en adulto mayor, ajuste por amputación y talla diana.
 *
 * Unidades: longitudes en cm, pliegues en mm, edad en años.
 */

const { normalizarSexo, round } = require("./calculosAntropometricos");

const num = (v) => {
    if (v === null || v === undefined || v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
};

// ─────────────────────────────────────────────────────────────────────────────
// 8.1 Edad corregida (prematuros): EPNC = EPN − (40 − EG)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Edad postnatal corregida en semanas.
 * @param {number} edadPostnatalSemanas EPN
 * @param {number} edadGestacionalSemanas EG al nacer
 * @returns {number|null} semanas corregidas
 */
function edadCorregidaSemanas(edadPostnatalSemanas, edadGestacionalSemanas) {
    const epn = num(edadPostnatalSemanas), eg = num(edadGestacionalSemanas);
    if (epn === null || eg === null) return null;
    return round(epn - (40 - eg), 1);
}

// ─────────────────────────────────────────────────────────────────────────────
// 8.2 Estimación de talla (cm) en postrados / sin bipedestación
// ─────────────────────────────────────────────────────────────────────────────

/** Media brazada simple: talla = media brazada × 2. */
const tallaMediaBrazada = (mediaBrazadaCm) => {
    const mb = num(mediaBrazadaCm);
    return mb === null ? null : round(mb * 2, 1);
};

/** Media brazada (Rabito): 63.525 − 3.237·S − 0.06904·E + 1.293·MB ; S = 1(H)/2(M). */
function tallaRabito(mediaBrazadaCm, edadAnios, sexo) {
    const mb = num(mediaBrazadaCm), e = num(edadAnios), s = normalizarSexo(sexo);
    if (mb === null || e === null || !s) return null;
    const S = s === "M" ? 1 : 2;
    return round(63.525 - 3.237 * S - 0.06904 * e + 1.293 * mb, 1);
}

/** Rodilla–maléolo LRM (Arango–Zamora). */
function tallaArangoZamora(lrmCm, edadAnios, sexo) {
    const lrm = num(lrmCm), e = num(edadAnios), s = normalizarSexo(sexo);
    if (lrm === null || e === null || !s) return null;
    return s === "M"
        ? round(lrm * 1.21 - 0.117 * e + 119.6, 1)
        : round(lrm * 1.263 - 0.159 * e + 107.7, 1);
}

/** Talón–rodilla TR (Chumlea 1985, adulto mayor). */
function tallaChumlea(trCm, edadAnios, sexo) {
    const tr = num(trCm), e = num(edadAnios), s = normalizarSexo(sexo);
    if (tr === null || e === null || !s) return null;
    return s === "M"
        ? round(2.02 * tr - 0.04 * e + 64.19, 1)
        : round(1.83 * tr - 0.24 * e + 84.88, 1);
}

/** < 12 años — longitud de brazo (LB). */
const tallaLongitudBrazo = (lbCm) => {
    const lb = num(lbCm);
    return lb === null ? null : round(4.35 * lb + 21.8, 1);
};

/** < 12 años — altura de rodilla (AR). */
const tallaAlturaRodilla = (arCm) => {
    const ar = num(arCm);
    return ar === null ? null : round(2.68 * ar + 24.2, 1);
};

/** < 12 años — longitud de tibia (LT). */
const tallaLongitudTibia = (ltCm) => {
    const lt = num(ltCm);
    return lt === null ? null : round(3.26 * lt + 30.8, 1);
};

// ─────────────────────────────────────────────────────────────────────────────
// 8.3 Estimación de peso (adulto mayor, altura talón–rodilla)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {Object} m  medidas: circunferencia braquial (cb, cm), circunferencia
 *  pantorrilla (cp, cm), pliegue subescapular (pcs, mm), altura rodilla (ar, cm).
 */
function estimarPesoAdultoMayor({ cb, cp, pcs, ar }, sexo) {
    const CB = num(cb), CP = num(cp), PCS = num(pcs), AR = num(ar);
    const s = normalizarSexo(sexo);
    if ([CB, CP, PCS, AR].some((x) => x === null) || !s) return null;
    return s === "M"
        ? round(1.73 * CB + 0.98 * CP + 0.37 * PCS + 1.16 * AR - 81.69, 1)
        : round(0.98 * CB + 1.27 * CP + 0.40 * PCS + 0.87 * AR - 62.35, 1);
}

// ─────────────────────────────────────────────────────────────────────────────
// 8.4 Amputados — ajuste del peso ideal
// ─────────────────────────────────────────────────────────────────────────────

/** Peso ideal ajustado = ((100 − %amp) × peso ideal por contextura) / 100. */
function pesoIdealAmputado(pesoIdeal, porcentajeAmputacion) {
    const pi = num(pesoIdeal), amp = num(porcentajeAmputacion);
    if (pi === null || amp === null) return null;
    return round(((100 - amp) * pi) / 100, 1);
}

// ─────────────────────────────────────────────────────────────────────────────
// 8.5 Talla diana (esperada según talla de los padres)
// ─────────────────────────────────────────────────────────────────────────────

/** Niño: media + 6.5 ; Niña: media − 6.5 (cm). */
function tallaDiana(tallaPadreCm, tallaMadreCm, sexo) {
    const tp = num(tallaPadreCm), tm = num(tallaMadreCm), s = normalizarSexo(sexo);
    if (tp === null || tm === null || !s) return null;
    const media = (tp + tm) / 2;
    return round(s === "M" ? media + 6.5 : media - 6.5, 1);
}

module.exports = {
    edadCorregidaSemanas,
    // estimación de talla
    tallaMediaBrazada,
    tallaRabito,
    tallaArangoZamora,
    tallaChumlea,
    tallaLongitudBrazo,
    tallaAlturaRodilla,
    tallaLongitudTibia,
    // estimación de peso / ajustes
    estimarPesoAdultoMayor,
    pesoIdealAmputado,
    tallaDiana,
};
