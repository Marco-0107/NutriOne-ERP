"use strict";

/**
 * Conversor de tablas oficiales OMS → formato JSON LMS del proyecto (Sprint 4).
 *
 * USO:
 *   1) Descarga las tablas LMS oficiales (ver backend/src/data/README.md):
 *        - OMS 2006 (0–5 años) y OMS 2007 (5–19 años).
 *        - Usa las versiones "z-scores" o "expandable" que traen columnas L, M, S.
 *        - Prefiere las tablas "by month" (edad en meses).
 *   2) Pon los archivos (.txt / .csv / .tsv) en:  backend/src/data/_fuentes_oms/
 *   3) Ejecuta:   node scripts/convertirTablasOMS.js
 *   4) Reinicia el backend. Los indicadores pediátricos se activan solos.
 *
 * El conversor infiere el INDICADOR y el SEXO desde el nombre del archivo y
 * detecta automáticamente el separador y las columnas L, M, S y la edad/talla.
 * Si algún archivo no se reconoce bien, agrégalo al objeto OVERRIDES de abajo.
 *
 * NO inventa datos: solo transforma lo que descargues de la fuente oficial.
 */

const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "..", "src", "data", "_fuentes_oms");
const OUT = path.join(__dirname, "..", "src", "data", "oms");

/**
 * Overrides manuales por nombre de archivo (opcional), por si la heurística falla:
 *   "mi_archivo.txt": { indicador: "imc_edad", sexo: "M", unidadEdad: "meses" }
 * indicador ∈ peso_edad | talla_edad | peso_talla | imc_edad | pce_edad
 * sexo ∈ M | F ; unidadEdad ∈ meses | dias (solo para indicadores por edad)
 */
const OVERRIDES = {};

const DIAS_POR_MES = 30.4375;

function inferIndicador(nombre) {
    const n = nombre.toLowerCase();
    if (/wfl|wfh|weight.?for.?(length|height)|peso.?talla/.test(n)) return { indicador: "peso_talla", variableX: "talla_cm" };
    if (/wfa|weight.?for.?age|peso.?edad/.test(n)) return { indicador: "peso_edad", variableX: "edad_meses" };
    if (/lhfa|\bhfa\b|height.?for.?age|length.?for.?age|stature|talla.?edad/.test(n)) return { indicador: "talla_edad", variableX: "edad_meses" };
    if (/bfa|bmi|imc/.test(n)) return { indicador: "imc_edad", variableX: "edad_meses" };
    if (/hcfa|head|cefal|\bhc[-_]/.test(n)) return { indicador: "pce_edad", variableX: "edad_meses" };
    return null;
}

function inferSexo(nombre) {
    const n = nombre.toLowerCase();
    if (/girl|nina|niña|female|mujer|_f[._-]|-f[._-]|\bf\b/.test(n)) return "F";
    if (/boy|nino|niño|male|hombre|_m[._-]|-m[._-]|\bm\b/.test(n)) return "M";
    return null;
}

function splitLinea(linea) {
    if (linea.includes("\t")) return linea.split("\t");
    if (linea.includes(";")) return linea.split(";");
    if (linea.includes(",")) return linea.split(",");
    return linea.trim().split(/\s+/);
}

const X_HEADERS = ["month", "months", "mes", "meses", "age", "agemos", "edad", "day", "days", "dia", "dias", "length", "height", "stature", "talla", "longitud"];

function parseArchivo(ruta, override) {
    const texto = fs.readFileSync(ruta, "utf8");
    const lineas = texto.split(/\r?\n/).filter((l) => l.trim() !== "");
    if (!lineas.length) return null;

    // Encontrar la fila de encabezado: la primera que contenga L, M y S como tokens.
    let headerIdx = -1, header = null;
    for (let i = 0; i < Math.min(lineas.length, 10); i++) {
        const cols = splitLinea(lineas[i]).map((c) => c.trim().toLowerCase());
        if (cols.includes("l") && cols.includes("m") && cols.includes("s")) { headerIdx = i; header = cols; break; }
    }
    if (headerIdx === -1) {
        console.warn(`  ⚠ ${path.basename(ruta)}: no se encontró encabezado con columnas L, M, S. Omitido.`);
        return null;
    }

    const li = header.indexOf("l"), mi = header.indexOf("m"), si = header.indexOf("s");
    let xi = header.findIndex((h) => X_HEADERS.includes(h));
    if (xi === -1) xi = 0; // por defecto, primera columna

    // Unidad de edad: explícita por override, o inferida del header.
    let unidadEdad = override?.unidadEdad;
    if (!unidadEdad) {
        const xh = header[xi];
        unidadEdad = /day|dia/.test(xh) ? "dias" : "meses";
    }

    const filas = [];
    for (let i = headerIdx + 1; i < lineas.length; i++) {
        const cols = splitLinea(lineas[i]).map((c) => c.trim());
        if (cols.length <= Math.max(li, mi, si, xi)) continue;
        let x = Number(cols[xi]), L = Number(cols[li]), M = Number(cols[mi]), S = Number(cols[si]);
        if (![x, L, M, S].every(Number.isFinite)) continue;
        if (unidadEdad === "dias") x = Number((x / DIAS_POR_MES).toFixed(4));
        filas.push({ x, L, M, S });
    }
    return filas.length ? filas : null;
}

function main() {
    if (!fs.existsSync(SRC)) {
        console.log(`\nNo existe la carpeta de fuentes:\n  ${SRC}\nCréala, coloca ahí los .txt oficiales de la OMS y vuelve a ejecutar.\n`);
        return;
    }
    const archivos = fs.readdirSync(SRC).filter((f) => /\.(txt|csv|tsv)$/i.test(f));
    if (!archivos.length) {
        console.log(`\nNo hay archivos .txt/.csv/.tsv en:\n  ${SRC}\n`);
        return;
    }

    const REF = { peso_edad: "OMS 2006/2007", talla_edad: "OMS 2006/2007", peso_talla: "OMS 2006", imc_edad: "OMS 2006/2007", pce_edad: "OMS 2007" };
    const acumulado = {}; // indicador → { variableX, datos: { M:[], F:[] } }

    console.log("\nProcesando archivos...\n");
    for (const archivo of archivos) {
        const ov = OVERRIDES[archivo] || {};
        const info = ov.indicador ? { indicador: ov.indicador, variableX: ov.indicador === "peso_talla" ? "talla_cm" : "edad_meses" } : inferIndicador(archivo);
        const sexo = ov.sexo || inferSexo(archivo);
        if (!info || !sexo) {
            console.warn(`  ⚠ ${archivo}: no pude inferir ${!info ? "indicador" : "sexo"}. Agrégalo a OVERRIDES. Omitido.`);
            continue;
        }
        const filas = parseArchivo(path.join(SRC, archivo), ov);
        if (!filas) continue;

        if (!acumulado[info.indicador]) acumulado[info.indicador] = { variableX: info.variableX, datos: { M: [], F: [] } };
        acumulado[info.indicador].datos[sexo].push(...filas);
        console.log(`  ✓ ${archivo} → ${info.indicador} [${sexo}] (${filas.length} filas)`);
    }

    if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

    let generados = 0;
    for (const [indicador, data] of Object.entries(acumulado)) {
        // ordenar por x y deduplicar
        for (const s of ["M", "F"]) {
            data.datos[s].sort((a, b) => a.x - b.x);
            const vistos = new Set();
            data.datos[s] = data.datos[s].filter((f) => (vistos.has(f.x) ? false : vistos.add(f.x)));
        }
        const salida = {
            indicador,
            referencia: REF[indicador] || "OMS",
            variableX: data.variableX,
            uso_clinico: true,
            datos: data.datos,
        };
        const ruta = path.join(OUT, `${indicador}.json`);
        fs.writeFileSync(ruta, JSON.stringify(salida, null, 2));
        console.log(`\n  → Generado ${path.relative(path.join(__dirname, ".."), ruta)} (M:${data.datos.M.length} F:${data.datos.F.length} filas)`);
        generados++;
    }

    console.log(`\n${generados ? `✅ ${generados} tabla(s) generada(s) en src/data/oms/. Reinicia el backend.` : "No se generó ninguna tabla."}\n`);
}

main();
