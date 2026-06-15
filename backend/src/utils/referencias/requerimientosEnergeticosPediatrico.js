'use strict';

const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, '../../data/requerimientosEnergeticos');

let _pediatrico = null;
let _lactantes = null;
let _nsi = null;

function _cargaPediatrico() {
    if (!_pediatrico) _pediatrico = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'pediatrico.json'), 'utf8'));
    return _pediatrico;
}

function _cargaLactantes() {
    if (!_lactantes) _lactantes = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'lactantes.json'), 'utf8'));
    return _lactantes;
}

function _cargaNSI() {
    if (!_nsi) _nsi = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'nsi_proteinas.json'), 'utf8'));
    return _nsi;
}

const FACTOR_ACTIVIDAD = {
    leve: 0.85, sedentario: 0.85,
    moderado: 1.0, moderada: 1.0,
    vigoroso: 1.15, vigorosa: 1.15,
};

/**
 * Returns kcal/kg/día for a child from DINTA/MINSAL tables.
 * @param {number} edadAnios  decimal age in years
 * @param {'M'|'F'} sexo
 * @param {'lm'|'formula'|'mixta'} tipoAlimentacion  only for age < 1
 */
function kcalPorKgDia(edadAnios, sexo, tipoAlimentacion) {
    if (edadAnios == null) return null;
    const s = String(sexo).toUpperCase().startsWith('M') ? 'M' : 'F';

    if (edadAnios < 1) {
        const tabla = _cargaLactantes();
        const mes = Math.floor(edadAnios * 12);
        const fila = tabla.filas.find(f => mes >= f.mes_min && mes < f.mes_max);
        if (!fila) return null;
        const tipo = tipoAlimentacion || 'mixta';
        const col = fila[tipo] ?? fila.mixta;
        return s === 'M' ? col.ninos : col.ninas;
    }

    const tabla = _cargaPediatrico();
    const fila = tabla.filas.find(f => edadAnios >= f.edad_min && edadAnios <= f.edad_max);
    if (!fila) return null;
    return s === 'M' ? fila.hombres : fila.mujeres;
}

/**
 * Calcula el requerimiento energético total para niños/as y adolescentes.
 * @param {number} edadAnios         edad decimal para buscar en tabla
 * @param {'M'|'F'} sexo
 * @param {number} pesoKg            peso actual en kg
 * @param {string} actividadCategoria leve|sedentario|moderado|vigoroso
 * @param {'lm'|'formula'|'mixta'} tipoAlimentacion  para lactantes < 1 año
 */
function calcularGETPediatrico(edadAnios, sexo, pesoKg, actividadCategoria, tipoAlimentacion) {
    if (pesoKg == null || edadAnios == null) return { disponible: false };

    const kcalKg = kcalPorKgDia(edadAnios, sexo, tipoAlimentacion);
    if (kcalKg == null) return { disponible: false };

    const getBase = Math.round(pesoKg * kcalKg);
    const factor = FACTOR_ACTIVIDAD[actividadCategoria] ?? 1.0;
    const get = Math.round(getBase * factor);

    return {
        disponible: true,
        kcalPorKg: kcalKg,
        getBase,
        factor,
        get,
        metodo: edadAnios < 1 ? 'Anexo 6 DINTA/MINSAL' : 'Anexo 7 DINTA/MINSAL',
    };
}

/**
 * Nivel seguro de ingesta de proteínas (g/kg/día).
 */
function nsiProteinas(edadAnios, sexo) {
    if (edadAnios == null) return null;
    const tabla = _cargaNSI();
    const fila = tabla.filas.find(f => edadAnios >= f.edad_min && edadAnios <= f.edad_max);
    if (!fila) return null;
    const s = String(sexo).toUpperCase().startsWith('M') ? 'M' : 'F';
    const nsi = fila.nsi_dri ?? (s === 'M' ? fila.nsi_dri_hombres : fila.nsi_dri_mujeres);
    return { fao: fila.nsi_fao, dri: nsi };
}

module.exports = { calcularGETPediatrico, kcalPorKgDia, nsiProteinas };
