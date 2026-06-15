"use strict";

/**
 * Factor Patología (FP) para pacientes hospitalizados (Sprint 4 — sección 5.4).
 * GET = GEB × PAL × FP.
 *
 * Cada patología define un valor por sexo. Cuando el documento entrega un rango
 * (ej. 1.15–1.3) el clínico elige dentro de él; aquí se expone { min, max, sugerido }
 * y `sugerido` por defecto es el extremo inferior (más conservador).
 */

/** Normaliza un valor (número fijo o [min,max]) a { min, max, sugerido }. */
const rango = (v) =>
    Array.isArray(v)
        ? { min: v[0], max: v[1], sugerido: v[0] }
        : { min: v, max: v, sugerido: v };

/** Tabla cruda: [nombre, valorHombres, valorMujeres]. */
const TABLA = [
    ["Hipometabolismo",            0.87,        0.81],
    ["Cirugía menor",              1.0,         1.0],
    ["Enfermedad inflamatoria intestinal (EII)", 1.07, 1.12],
    ["Infección",                  1.12,        1.39],
    ["Enfermedad pancreática",     1.13,        1.15],
    ["Tumor",                      1.15,        1.25],
    ["Fractura de huesos largos",  [1.15, 1.3], [1.15, 1.3]],
    ["Leucemia / Linfoma",         1.19,        1.27],
    ["Abscesos (T° < 37.8°C)",     1.20,        1.21],
    ["Cirugía",                    1.20,        1.39],
    ["Cáncer",                     [1.2, 1.4],  [1.2, 1.4]],
    ["Infección severa",           [1.2, 1.4],  [1.2, 1.4]],
    ["Politrauma",                 [1.2, 1.4],  [1.2, 1.4]],
    ["Falla orgánica múltiple",    [1.2, 1.4],  [1.2, 1.4]],
    ["Peritonitis",                [1.2, 1.4],  [1.2, 1.4]],
    ["Trasplantes",                1.33,        1.27],
    ["Ventilación mecánica",       1.34,        1.32],
    ["Fiebre (T° > 37.8°C)",       1.41,        1.47],
    ["Sepsis",                     1.4,         1.6],
    ["Quemaduras",                 1.52,        1.64],
];

/** Lista estructurada para el selector del frontend (endpoint /calculos/patologias). */
const FACTOR_PATOLOGIA = TABLA.map(([patologia, h, m]) => ({
    patologia,
    hombres: rango(h),
    mujeres: rango(m),
}));

/**
 * Devuelve el FP sugerido para una patología y sexo ('M'|'F').
 * @returns {{ min:number, max:number, sugerido:number } | null}
 */
function factorPatologiaPara(patologia, sexo) {
    const fila = FACTOR_PATOLOGIA.find((f) => f.patologia === patologia);
    if (!fila) return null;
    return sexo === "M" ? fila.hombres : fila.mujeres;
}

module.exports = { FACTOR_PATOLOGIA, factorPatologiaPara };
