"use strict";

/**
 * Etapa del ciclo vital (Sprint 4 — sección 2 del documento maestro).
 *
 * La etapa determina qué clasificaciones, fórmulas (GEB), distribución de macros
 * y referencias antropométricas se aplican. Se calcula a partir de la edad exacta.
 *
 * Convención de unidades del módulo de cálculos:
 *   - peso:      kg
 *   - talla:     cm  (así la captura la ficha clínica; se convierte a m donde se requiere)
 *   - perímetros: cm
 *   - pliegues:  mm
 */

/** Identificadores estables de etapa (se persisten en evaluacion_nutricional.etapa_ciclo_vital). */
const ETAPAS = {
    RECIEN_NACIDO:   "recien_nacido",
    LACTANTE_MENOR:  "lactante_menor",
    LACTANTE_MAYOR:  "lactante_mayor",
    PREESCOLAR:      "preescolar",
    ESCOLAR:         "escolar",
    ADOLESCENTE:     "adolescente",
    ADULTO:          "adulto",
    ADULTO_MAYOR:    "adulto_mayor",
    EMBARAZADA:      "embarazada",
    NODRIZA:         "nodriza",
};

/** Etiquetas legibles para UI / diagnóstico. */
const ETIQUETAS_ETAPA = {
    [ETAPAS.RECIEN_NACIDO]:  "Recién nacido",
    [ETAPAS.LACTANTE_MENOR]: "Lactante menor",
    [ETAPAS.LACTANTE_MAYOR]: "Lactante mayor",
    [ETAPAS.PREESCOLAR]:     "Preescolar",
    [ETAPAS.ESCOLAR]:        "Escolar",
    [ETAPAS.ADOLESCENTE]:    "Adolescente",
    [ETAPAS.ADULTO]:         "Adulto",
    [ETAPAS.ADULTO_MAYOR]:   "Adulto mayor",
    [ETAPAS.EMBARAZADA]:     "Embarazada",
    [ETAPAS.NODRIZA]:        "Nodriza",
};

/**
 * Calcula la edad exacta (años, meses, días) entre dos fechas.
 * @param {string|Date} fechaNacimiento
 * @param {string|Date} [fechaReferencia=hoy]
 * @returns {{ años:number, meses:number, días:number, totalMeses:number, totalDias:number }|null}
 */
function calcularEdadExacta(fechaNacimiento, fechaReferencia = new Date()) {
    if (!fechaNacimiento) return null;
    const nac = new Date(fechaNacimiento);
    const ref = new Date(fechaReferencia);
    if (isNaN(nac.getTime()) || isNaN(ref.getTime()) || nac > ref) return null;

    let años  = ref.getFullYear() - nac.getFullYear();
    let meses = ref.getMonth() - nac.getMonth();
    let días  = ref.getDate() - nac.getDate();

    if (días < 0) {
        meses -= 1;
        // días del mes anterior a la fecha de referencia
        const diasMesAnterior = new Date(ref.getFullYear(), ref.getMonth(), 0).getDate();
        días += diasMesAnterior;
    }
    if (meses < 0) {
        años -= 1;
        meses += 12;
    }

    const totalDias  = Math.floor((ref - nac) / 86_400_000);
    const totalMeses = años * 12 + meses;

    return { años, meses, días, totalMeses, totalDias };
}

/**
 * Edad en meses cumplidos para buscar en tablas, con la regla MINSAL de redondeo:
 * 15 días o más se consideran un mes más.
 * Ej.: 7a 1m 14d → 85 meses; 7a 1m 15d → 86 meses.
 * @param {{años:number,meses:number,días:number}} edadExacta
 * @returns {number|null}
 */
function edadEnMesesRedondeada(edadExacta) {
    if (!edadExacta) return null;
    const { años, meses, días } = edadExacta;
    return años * 12 + meses + (días >= 15 ? 1 : 0);
}

/**
 * Determina la etapa del ciclo vital.
 *
 * Reglas (sección 2). Notas de diseño:
 *  - El tramo Adolescente (10–19) y Adulto (18–64) se solapan en el documento.
 *    La nutricionista confirmó por audio que el adulto parte a los 18, por lo que
 *    aquí adolescente cubre 10 a 17 años 11 m 29 d y adulto parte a los 18.
 *  - Embarazada / Nodriza NO dependen de la edad: se activan por bandera clínica
 *    y tienen prioridad sobre adulto/adolescente.
 *
 * @param {Object} params
 * @param {{años:number,meses:number,días:number,totalMeses:number,totalDias:number}} [params.edad]
 *        Edad exacta (preferida). Si no se entrega, se usa `años`.
 * @param {number} [params.años]   Edad en años cumplidos (fallback cuando no hay fecha de nacimiento).
 * @param {boolean} [params.embarazada]
 * @param {boolean} [params.nodriza]
 * @returns {{ etapa:string, etiqueta:string, esPediatrico:boolean }}
 */
function determinarEtapa({ edad, años, embarazada = false, nodriza = false } = {}) {
    if (embarazada) return etapaResult(ETAPAS.EMBARAZADA);
    if (nodriza)    return etapaResult(ETAPAS.NODRIZA);

    const _a = Number.isFinite(años) ? años : null;
    const e = edad || (_a !== null ? {
        años: Math.floor(_a),
        meses: Math.floor((_a - Math.floor(_a)) * 12),
        días: 0,
        totalMeses: _a * 12,
        totalDias: _a * 365,
    } : null);
    if (!e) return etapaResult(ETAPAS.ADULTO); // sin datos: asumir adulto (caso más común)

    // Recién nacido: < 29 días (criterio MINSAL).
    if (e.totalDias < 29 && e.años === 0 && e.meses === 0) return etapaResult(ETAPAS.RECIEN_NACIDO);

    // Lactante menor: 1 mes a 11 meses.
    if (e.años === 0) return etapaResult(ETAPAS.LACTANTE_MENOR);

    // Lactante mayor: 1 a 1 año 11 m 29 d.
    if (e.años === 1) return etapaResult(ETAPAS.LACTANTE_MAYOR);

    // Preescolar: 2 a 5 a 11 m 29 d.
    if (e.años >= 2 && e.años <= 5) return etapaResult(ETAPAS.PREESCOLAR);

    // Escolar: 6 a 9 a 11 m 29 d.
    if (e.años >= 6 && e.años <= 9) return etapaResult(ETAPAS.ESCOLAR);

    // Adolescente: 10 a 17 a 11 m 29 d (adulto parte a los 18 — confirmado por nutricionista).
    if (e.años >= 10 && e.años <= 17) return etapaResult(ETAPAS.ADOLESCENTE);

    // Adulto: 18 a 64.
    if (e.años >= 18 && e.años <= 64) return etapaResult(ETAPAS.ADULTO);

    // Adulto mayor: >= 65.
    return etapaResult(ETAPAS.ADULTO_MAYOR);
}

const PEDIATRICAS = new Set([
    ETAPAS.RECIEN_NACIDO,
    ETAPAS.LACTANTE_MENOR,
    ETAPAS.LACTANTE_MAYOR,
    ETAPAS.PREESCOLAR,
    ETAPAS.ESCOLAR,
    ETAPAS.ADOLESCENTE,
]);

function etapaResult(etapa) {
    return {
        etapa,
        etiqueta: ETIQUETAS_ETAPA[etapa],
        esPediatrico: PEDIATRICAS.has(etapa),
    };
}

module.exports = {
    ETAPAS,
    ETIQUETAS_ETAPA,
    calcularEdadExacta,
    edadEnMesesRedondeada,
    determinarEtapa,
};
