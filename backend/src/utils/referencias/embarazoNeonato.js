"use strict";

/**
 * Embarazo, nodriza y recién nacido (Sprint 4 — secciones 9 y 10).
 *
 * Incluye las tablas pequeñas y estables (rangos de ganancia de peso gestacional
 * IOM/MINSAL, clasificación de IMC de la embarazada por MINSAL 2021 ≈ OMS adultos,
 * e incremento ponderal del RN). La curva de Atalah (IMC por semana de gestación)
 * se deja como dataset opcional en data/ (ver data/README.md).
 */

const num = (v) => {
    if (v === null || v === undefined || v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
};

// ── 10. Embarazada ───────────────────────────────────────────────────────────

/**
 * Clasificación del estado nutricional de la embarazada.
 * MINSAL 2021 adopta cortes equivalentes a OMS para adultos sobre el IMC actual.
 * (La evaluación por semana de gestación con curva de Atalah se habilita si se
 *  carga el dataset correspondiente.)
 */
function clasificarIMCEmbarazada(imc) {
    const v = num(imc);
    if (v === null) return null;
    if (v < 18.5) return "Bajo peso";
    if (v < 25.0) return "Normal";
    if (v < 30.0) return "Sobrepeso";
    return "Obesidad";
}

/**
 * Rango de ganancia de peso gestacional recomendada (kg, embarazo único)
 * según IMC pregestacional — Institute of Medicine 2009 / MINSAL.
 * @returns {{ categoria:string, min:number, max:number }|null}
 */
function gananciaPesoRecomendada(imcPregestacional) {
    const v = num(imcPregestacional);
    if (v === null) return null;
    if (v < 18.5) return { categoria: "Bajo peso",  min: 12.5, max: 18 };
    if (v < 25.0) return { categoria: "Normal",     min: 11.5, max: 16 };
    if (v < 30.0) return { categoria: "Sobrepeso",  min: 7,    max: 11.5 };
    return { categoria: "Obesidad", min: 5, max: 9 };
}

/**
 * Evalúa la ganancia de peso real frente al rango recomendado.
 * @returns {{ ganancia:number, recomendado:object, estado:string }|null}
 */
function evaluarGananciaPeso({ pesoActual, pesoPregestacional, imcPregestacional }) {
    const a = num(pesoActual), p = num(pesoPregestacional);
    if (a === null || p === null) return null;
    const ganancia = Number((a - p).toFixed(1));
    const rec = gananciaPesoRecomendada(imcPregestacional);
    let estado = null;
    if (rec) {
        if (ganancia < rec.min) estado = "Ganancia insuficiente";
        else if (ganancia > rec.max) estado = "Ganancia excesiva";
        else estado = "Ganancia adecuada";
    }
    return { ganancia, recomendado: rec, estado };
}

// ── 9. Recién nacido — incremento ponderal ───────────────────────────────────

/** g/día = (peso2 − peso1) en gramos / días transcurridos. */
function incrementoPonderalDiario({ pesoInicialKg, pesoFinalKg, dias }) {
    const p1 = num(pesoInicialKg), p2 = num(pesoFinalKg), d = num(dias);
    if (p1 === null || p2 === null || !d) return null;
    return Number((((p2 - p1) * 1000) / d).toFixed(1));
}

/** Clasifica el incremento ponderal del RN: ≥ 20 g/día buen incremento. */
function clasificarIncrementoPonderal(gramosPorDia) {
    const v = num(gramosPorDia);
    if (v === null) return null;
    return v >= 20 ? "Buen incremento ponderal" : "Mal incremento ponderal";
}

module.exports = {
    clasificarIMCEmbarazada,
    gananciaPesoRecomendada,
    evaluarGananciaPeso,
    incrementoPonderalDiario,
    clasificarIncrementoPonderal,
};
