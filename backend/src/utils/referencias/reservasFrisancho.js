'use strict';

const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, '../../data/frisancho');

const _cache = {};

function _cargar(indicador, sexo) {
    const key = `${indicador}_${sexo === 'M' ? 'hombres' : 'mujeres'}`;
    if (_cache[key]) return _cache[key];
    const archivo = path.join(DATA_DIR, `${key}.json`);
    if (!fs.existsSync(archivo)) return null;
    _cache[key] = JSON.parse(fs.readFileSync(archivo, 'utf8'));
    return _cache[key];
}

function buscarFila(tabla, edadAnios) {
    if (!tabla || edadAnios == null) return null;
    return tabla.filas.find(f => edadAnios >= f.edad_min && edadAnios <= f.edad_max) ?? null;
}

function calcularPercentil(fila, columnas, valor) {
    if (!fila || valor == null) return null;
    const vals = fila.valores;
    const n = columnas.length;

    if (valor <= vals[0]) return columnas[0] * 0.5;
    if (valor >= vals[n - 1]) return columnas[n - 1] + 2.5;

    for (let i = 0; i < n - 1; i++) {
        if (valor >= vals[i] && valor <= vals[i + 1]) {
            const ratio = (valor - vals[i]) / (vals[i + 1] - vals[i]);
            return columnas[i] + ratio * (columnas[i + 1] - columnas[i]);
        }
    }
    return null;
}

function clasificarFrisancho(percentil) {
    if (percentil == null) return null;
    if (percentil <= 5)  return 'Muy baja';
    if (percentil <= 10) return 'Baja';
    if (percentil <= 90) return 'Normal';
    if (percentil <= 95) return 'Alta';
    return 'Muy alta';
}

/**
 * @param {'pct'|'cmb'|'amb'|'agb'} indicador
 * @param {'M'|'F'} sexo
 * @param {number} edadAnios  edad decimal (e.g., 12.5)
 * @param {number} valor      medición en las unidades de la tabla (mm o mm²)
 */
function evaluarReserva(indicador, sexo, edadAnios, valor) {
    if (!indicador || !sexo || edadAnios == null || valor == null) {
        return { disponible: false };
    }

    const sexoNorm = String(sexo).toUpperCase() === 'M' ? 'M' : 'F';
    const tabla = _cargar(indicador, sexoNorm);
    if (!tabla) return { disponible: false };

    const fila = buscarFila(tabla, edadAnios);
    if (!fila) return { disponible: false };

    const percentil = calcularPercentil(fila, tabla.columnas_percentil, valor);
    if (percentil == null) return { disponible: false };

    return {
        disponible: true,
        indicador,
        tabla: tabla.tabla,
        tipo_reserva: tabla.tipo_reserva,
        valor,
        unidad: tabla.unidad,
        percentil: Math.round(percentil * 10) / 10,
        clasificacion: clasificarFrisancho(percentil),
    };
}

module.exports = { evaluarReserva, buscarFila, calcularPercentil, clasificarFrisancho };
