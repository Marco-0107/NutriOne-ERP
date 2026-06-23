"use strict";

/**
 * Indicadores antropométricos pediátricos basados en tablas de referencia
 * (Sprint 4 — sección 9): P/E, T/E, P/T, IMC/E, PCe/E.
 *
 * Las tablas LMS oficiales (OMS 2006/2007, Alarcón–Pittaluga, Fenton, Fernández,
 * Brook, Zemel) se cargan como JSON desde backend/src/data/ (ver data/README.md).
 * Mientras un dataset no esté presente, el indicador responde { disponible:false }
 * con un motivo claro — NO se inventan valores clínicos.
 */

const fs = require("fs");
const path = require("path");
const { zScoreLMS, percentilDesdeZ, interpolarLMS, clasificarZ } = require("./lms");

const DATA_DIR = path.join(__dirname, "..", "..", "data");

/** Mapa indicador → archivo de dataset esperado. */
const ARCHIVOS = {
    peso_edad:  "oms/peso_edad.json",
    talla_edad: "oms/talla_edad.json",
    peso_talla: "oms/peso_talla.json", // estructura especial (sub-tablas) → usar evaluarPesoTalla
    imc_edad:   "oms/imc_edad.json",
};

const _cache = new Map();

/** Carga (con caché) un dataset desde data/. Devuelve null si no existe. */
function cargarDataset(indicador) {
    if (_cache.has(indicador)) return _cache.get(indicador);
    const archivo = ARCHIVOS[indicador];
    let data = null;
    try {
        const ruta = path.join(DATA_DIR, archivo);
        if (fs.existsSync(ruta)) {
            const json = JSON.parse(fs.readFileSync(ruta, "utf8"));
            // Ignorar archivos marcados como muestra no clínica salvo que se pidan explícitamente.
            if (json && json.uso_clinico !== false) data = json;
            else if (json && json.__permitir_muestra) data = json;
        }
    } catch {
        data = null;
    }
    _cache.set(indicador, data);
    return data;
}

const normSexo = (sexo) => {
    const s = sexo ? String(sexo).trim().toLowerCase() : "";
    if (["m", "masculino", "hombre"].includes(s)) return "M";
    if (["f", "femenino", "mujer"].includes(s)) return "F";
    return null;
};

/**
 * Evalúa un indicador pediátrico.
 * @param {string} indicador  peso_edad | talla_edad | peso_talla | imc_edad | pce_edad
 * @param {string} sexo
 * @param {number} x          variable independiente (edad en meses, o talla en cm para P/T)
 * @param {number} valor      medición a evaluar (peso, talla, imc, perímetro cefálico)
 * @returns {{disponible:boolean, z?:number, percentil?:number, clasificacion?:string, referencia?:string, motivo?:string}}
 */
function evaluarIndicador(indicador, sexo, x, valor) {
    const ds = cargarDataset(indicador);
    if (!ds) {
        return { disponible: false, motivo: `Falta la tabla de referencia (${ARCHIVOS[indicador] || indicador}). Ver data/README.md.` };
    }
    const s = normSexo(sexo);
    if (!s) return { disponible: false, motivo: "Sexo no especificado." };
    const tabla = ds.datos?.[s];
    if (!Array.isArray(tabla) || !tabla.length) return { disponible: false, motivo: "Dataset sin filas para el sexo indicado." };
    if (!Number.isFinite(x) || !Number.isFinite(valor)) return { disponible: false, motivo: "Faltan mediciones." };

    const lms = interpolarLMS(tabla, x);
    if (!lms) return { disponible: false, motivo: `Valor ${x} fuera del rango de la tabla (${ds.referencia || ""}).` };

    const z = zScoreLMS(valor, lms);
    return {
        disponible: true,
        z,
        percentil: percentilDesdeZ(z),
        clasificacion: clasificarZ(z, indicador),
        referencia: ds.referencia || null,
    };
}

/**
 * Evalúa Peso/Talla (P/T). Usa la sub-tabla por edad: longitud (< 2 años, acostado)
 * o estatura (≥ 2 años, de pie), interpolando por la talla en cm.
 * @returns igual que evaluarIndicador, con `subtabla`.
 */
function evaluarPesoTalla(sexo, edadMeses, tallaCm, pesoKg) {
    const ds = cargarDataset("peso_talla");
    if (!ds) return { disponible: false, motivo: "Falta la tabla Peso/Talla (oms/peso_talla.json)." };
    const s = normSexo(sexo);
    if (!s) return { disponible: false, motivo: "Sexo no especificado." };
    if (!Number.isFinite(tallaCm) || !Number.isFinite(pesoKg)) return { disponible: false, motivo: "Faltan mediciones." };

    const subtabla = (Number.isFinite(edadMeses) && edadMeses < 24) ? "longitud" : "estatura";
    const tabla = ds.datos?.[s]?.[subtabla];
    if (!Array.isArray(tabla) || !tabla.length) return { disponible: false, motivo: `Dataset P/T sin sub-tabla ${subtabla}.` };

    const lms = interpolarLMS(tabla, tallaCm);
    if (!lms) return { disponible: false, motivo: `Talla ${tallaCm} cm fuera del rango de la sub-tabla ${subtabla}.` };

    const z = zScoreLMS(pesoKg, lms);
    return {
        disponible: true,
        z,
        percentil: percentilDesdeZ(z),
        clasificacion: clasificarZ(z, "peso_talla"),
        subtabla,
        referencia: ds.referencia || null,
    };
}

/** ¿Hay al menos una tabla pediátrica cargada? (útil para mostrar avisos). */
function hayTablasPediatricas() {
    return ["peso_edad", "talla_edad", "imc_edad", "peso_talla"].some((k) => cargarDataset(k));
}

/** Limpia la caché (para tests). */
function _resetCache() { _cache.clear(); }

module.exports = { evaluarIndicador, evaluarPesoTalla, hayTablasPediatricas, cargarDataset, _resetCache, ARCHIVOS };
