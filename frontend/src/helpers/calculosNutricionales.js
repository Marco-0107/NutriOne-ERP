/**
 * Espejo de las fórmulas de cálculo nutricional (Sprint 4) para cálculo EN VIVO
 * en el cliente, sin round-trips. Replica fielmente el backend
 * (backend/src/utils/*). La fuente de verdad es el backend; al guardar se
 * persiste vía POST/PUT /calculos/... y el servidor recalcula.
 *
 * Unidades: peso kg · talla cm · perímetros cm · pliegues mm.
 */

const PI = Math.PI;

export const round = (x, dec = 2) =>
    (x === null || x === undefined || Number.isNaN(x)) ? null : Number(Number(x).toFixed(dec));

export const num = (v) => {
    if (v === null || v === undefined || v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
};

export function normalizarSexo(sexo) {
    if (!sexo) return null;
    const s = String(sexo).trim().toLowerCase();
    if (["m", "masculino", "hombre", "varón", "varon"].includes(s)) return "M";
    if (["f", "femenino", "mujer"].includes(s)) return "F";
    return null;
}

// ── Etapa del ciclo vital ───────────────────────────────────────────────────
export const ETAPAS = {
    RECIEN_NACIDO: "recien_nacido", LACTANTE_MENOR: "lactante_menor", LACTANTE_MAYOR: "lactante_mayor",
    PREESCOLAR: "preescolar", ESCOLAR: "escolar", ADOLESCENTE: "adolescente",
    ADULTO: "adulto", ADULTO_MAYOR: "adulto_mayor", EMBARAZADA: "embarazada", NODRIZA: "nodriza",
};
const ETIQUETAS_ETAPA = {
    recien_nacido: "Recién nacido", lactante_menor: "Lactante menor", lactante_mayor: "Lactante mayor",
    preescolar: "Preescolar", escolar: "Escolar", adolescente: "Adolescente",
    adulto: "Adulto", adulto_mayor: "Adulto mayor", embarazada: "Embarazada", nodriza: "Nodriza",
};
const PEDIATRICAS = new Set(["recien_nacido", "lactante_menor", "lactante_mayor", "preescolar", "escolar", "adolescente"]);

export function determinarEtapa({ años, embarazada = false, nodriza = false } = {}) {
    const wrap = (etapa) => ({ etapa, etiqueta: ETIQUETAS_ETAPA[etapa], esPediatrico: PEDIATRICAS.has(etapa) });
    if (embarazada) return wrap("embarazada");
    if (nodriza) return wrap("nodriza");
    const a = num(años);
    if (a === null) return wrap("adulto");
    if (a < 1) return wrap("lactante_menor");
    if (a === 1) return wrap("lactante_mayor");
    if (a <= 5) return wrap("preescolar");
    if (a <= 9) return wrap("escolar");
    if (a <= 17) return wrap("adolescente");
    if (a <= 64) return wrap("adulto");
    return wrap("adulto_mayor");
}

// ── 4.1 IMC ──────────────────────────────────────────────────────────────────
export function calcularIMC(pesoKg, tallaCm) {
    const p = num(pesoKg), t = num(tallaCm);
    if (!p || !t) return null;
    const m = t / 100;
    return round(p / (m * m), 1);
}
export function clasificarIMC(imc, etapa) {
    const v = num(imc);
    if (v === null) return null;
    if (etapa === "adulto_mayor") {
        if (v < 23.0) return "Bajo peso";
        if (v < 28.0) return "Normal";
        if (v < 32.0) return "Sobrepeso";
        return "Obesidad";
    }
    if (etapa === "adulto" || !etapa) {
        if (v < 18.5) return "Bajo peso";
        if (v < 25.0) return "Normal";
        if (v < 30.0) return "Sobrepeso";
        if (v < 35.0) return "Obesidad Tipo 1";
        if (v < 40.0) return "Obesidad Tipo 2";
        return "Obesidad Tipo 3";
    }
    return null;
}

// ── 4.2 Pesos de referencia ──────────────────────────────────────────────────
const IMC_REFERENCIA = {
    adulto: { ideal: 21.7, min: 18.5, max: 24.9 },
    adulto_mayor: { ideal: 25.5, min: 23.1, max: 27.9 },
};
export function pesosReferencia(tallaCm, etapa, imcMeta = null) {
    const t = num(tallaCm);
    const ref = IMC_REFERENCIA[etapa] || IMC_REFERENCIA.adulto;
    if (!t) return { ideal: null, minimo: null, maximo: null, meta: null };
    const m2 = (t / 100) ** 2;
    return {
        ideal: round(ref.ideal * m2, 1),
        minimo: round(ref.min * m2, 1),
        maximo: round(ref.max * m2, 1),
        meta: num(imcMeta) ? round(num(imcMeta) * m2, 1) : null,
    };
}

// ── 4.3 %PP ──────────────────────────────────────────────────────────────────
export function porcentajePerdidaPeso(pesoHabitual, pesoActual) {
    const h = num(pesoHabitual), a = num(pesoActual);
    if (!h || !a) return null;
    return round(((h - a) / h) * 100, 1);
}
export function clasificarPerdidaPeso(pp, periodo) {
    const v = num(pp);
    if (v === null) return null;
    if (v <= 0) return "Sin pérdida significativa";
    const cortes = { "1s": 2, "1m": 5, "3m": 7.5, "6m": 10 };
    const severo = cortes[periodo];
    if (severo === undefined) return null;
    if (v > severo) return "Pérdida severa";
    const signif = periodo === "1s" ? 1 : severo;
    return v >= signif ? "Pérdida significativa" : "Sin pérdida significativa";
}

// ── 4.4 Contextura ───────────────────────────────────────────────────────────
export function indiceContextura(tallaCm, perimetroMunecaCm) {
    const t = num(tallaCm), w = num(perimetroMunecaCm);
    if (!t || !w) return null;
    return round(t / w, 1);
}
export function clasificarContextura(indice, sexo) {
    const v = num(indice), s = normalizarSexo(sexo);
    if (v === null || !s) return null;
    if (s === "M") { if (v > 10.4) return "Pequeña"; if (v >= 9.6) return "Mediana"; return "Grande"; }
    if (v > 11.0) return "Pequeña"; if (v >= 10.1) return "Mediana"; return "Grande";
}

// ── 4.5–4.9 índices y perímetros ─────────────────────────────────────────────
export function clasificarCuello(cuelloCm, sexo) {
    const v = num(cuelloCm), s = normalizarSexo(sexo);
    if (v === null || !s) return null;
    return v > (s === "M" ? 37 : 34) ? "Riesgo metabólico" : "Sin riesgo";
}
export function clasificarCintura(cinturaCm, sexo, etapa) {
    const v = num(cinturaCm), s = normalizarSexo(sexo);
    if (v === null || !s) return null;
    const esPediatrico = etapa === "escolar" || etapa === "adolescente";
    let nivel;
    if (s === "M") { nivel = v < 88 ? 0 : v <= 102 ? 1 : 2; }
    else { nivel = v < 80 ? 0 : v <= 88 ? 1 : 2; }
    if (nivel === 0) return "Normal";
    if (esPediatrico) return nivel === 1 ? "Riesgo de obesidad abdominal" : "Obesidad abdominal";
    return nivel === 1 ? "Riesgo aumentado" : "Riesgo muy alto";
}
export function calcularICA(cinturaCm, tallaCm) {
    const c = num(cinturaCm), t = num(tallaCm);
    if (!c || !t) return null;
    return round(c / t, 2);
}
export const clasificarICA = (ica) => (num(ica) === null ? null : (num(ica) <= 0.5 ? "Sin riesgo" : "Riesgo metabólico"));
export function calcularICC(cinturaCm, caderaCm) {
    const c = num(cinturaCm), h = num(caderaCm);
    if (!c || !h) return null;
    return round(c / h, 3);
}
export function clasificarICC(icc, sexo) {
    const v = num(icc), s = normalizarSexo(sexo);
    if (v === null || !s) return null;
    if (s === "M") { if (v < 0.78) return "Ginoide"; if (v <= 0.94) return "Mixta"; return "Androide"; }
    if (v < 0.71) return "Ginoide"; if (v <= 0.84) return "Mixta"; return "Androide";
}
export const clasificarPantorrilla = (cm) =>
    (num(cm) === null ? null : (num(cm) >= 31 ? "Sin depleción" : "Depleción de reservas proteicas"));

// ── 4.10 Reservas braquiales ─────────────────────────────────────────────────
export function reservasBraquiales(braquialCm, tricipitalMm) {
    const pbCm = num(braquialCm), pct = num(tricipitalMm);
    if (!pbCm || pct === null) return { cmb: null, amb: null, ab: null, agb: null };
    const pb = pbCm * 10;
    const cmb = pb - PI * pct;
    const amb = (cmb * cmb) / (4 * PI);
    const ab = (PI / 4) * ((pb / PI) ** 2);
    return { cmb: round(cmb, 1), amb: round(amb, 1), ab: round(ab, 1), agb: round(ab - amb, 1) };
}

// ── 4.11 % grasa ─────────────────────────────────────────────────────────────
export function grasaFaulkner({ tricipital, subescapular, supraespinal, abdominal }, sexo) {
    const t = num(tricipital), sb = num(subescapular), sp = num(supraespinal), ab = num(abdominal);
    const s = normalizarSexo(sexo);
    if ([t, sb, sp, ab].some((x) => x === null) || !s) return null;
    const sigma4 = t + sb + sp + ab;
    return round(s === "M" ? 0.153 * sigma4 + 5.783 : 0.213 * sigma4 + 7.9, 1);
}
export function grasaSlaughter({ tricipital, subescapular }, sexo, maduracion = "prepuber") {
    const T = num(tricipital), S = num(subescapular), sx = normalizarSexo(sexo);
    if (T === null || S === null || !sx) return null;
    const suma = T + S;
    let pct;
    if (suma <= 35) {
        if (sx === "M") pct = maduracion === "puber" ? 1.21 * suma - 0.008 * suma * suma - 3.4 : 1.21 * suma - 0.008 * suma * suma - 1.7;
        else pct = 1.33 * suma - 0.013 * suma * suma - 2.5;
    } else {
        pct = sx === "M" ? 0.783 * suma + 1.6 : 0.546 * suma + 9.7;
    }
    return round(pct, 1);
}
export function clasificarGrasa(porcentaje, sexo) {
    const v = num(porcentaje), s = normalizarSexo(sexo);
    if (v === null || !s) return null;
    if (s === "M") { if (v < 10) return "Déficit"; if (v <= 20) return "Normal"; return "Exceso"; }
    if (v < 20) return "Déficit"; if (v <= 30) return "Normal"; return "Exceso";
}

// ── 5. Energético ────────────────────────────────────────────────────────────
const COEF_GEB = {
    M: [{ maxEdad: 29, a: 15.057, b: 692.2 }, { maxEdad: 59, a: 11.472, b: 873.1 }, { maxEdad: Infinity, a: 11.711, b: 587.7 }],
    F: [{ maxEdad: 29, a: 14.818, b: 486.6 }, { maxEdad: 59, a: 8.126, b: 845.6 }, { maxEdad: Infinity, a: 9.082, b: 658.5 }],
};
export function calcularGEB({ pesoKg, edadAnios, sexo }) {
    const p = num(pesoKg), edad = num(edadAnios), s = normalizarSexo(sexo);
    if (!p || edad === null || !s) return null;
    if (edad < 18) return null;
    const tramo = COEF_GEB[s].find((t) => edad <= t.maxEdad);
    return round(tramo.a * p + tramo.b, 0);
}
export const PAL_CATEGORIAS = {
    sedentario: { min: 1.40, max: 1.69, sugerido: 1.55, etiqueta: "Sedentario" },
    moderado: { min: 1.70, max: 1.99, sugerido: 1.85, etiqueta: "Activo / Moderado" },
    vigoroso: { min: 2.00, max: 2.40, sugerido: 2.20, etiqueta: "Vigoroso" },
};
export const palSugerido = (categoria) => PAL_CATEGORIAS[categoria]?.sugerido ?? null;
export function calcularGET(geb, pal, fp = null) {
    const g = num(geb), p = num(pal), f = num(fp);
    if (!g || !p) return null;
    return round(f ? g * p * f : g * p, 0);
}

// ── 6. Macronutrientes ───────────────────────────────────────────────────────
export const RANGOS_MACROS = {
    adulto: { pro: [10, 15], cho: [50, 60], lip: [20, 30] },
    adulto_mayor: { pro: [15, 20], cho: [50, 60], lip: [20, 35] },
    embarazada: { pro: [10, 20], cho: [50, 60], lip: [25, 30] },
    nodriza: { pro: [10, 20], cho: [50, 60], lip: [25, 30] },
    lactante_menor: { pro: [7, 10], cho: [50, 60], lip: [30, 45] },
    lactante_mayor: { pro: [7, 10], cho: [50, 60], lip: [30, 35] },
    preescolar: { pro: [10, 12], cho: [50, 60], lip: [30, 35] },
    escolar: { pro: [12, 15], cho: [50, 65], lip: [30, 35] },
    adolescente: { pro: [15, 15], cho: [55, 60], lip: [25, 30] },
};
export const rangosPorEtapa = (etapa) => RANGOS_MACROS[etapa] || RANGOS_MACROS.adulto;
export function sugeridoMacros(etapa) {
    const r = rangosPorEtapa(etapa);
    const pro = Math.round((r.pro[0] + r.pro[1]) / 2);
    const lip = Math.round((r.lip[0] + r.lip[1]) / 2);
    return { pro, cho: 100 - pro - lip, lip };
}
const KCAL_POR_GRAMO = { pro: 4, cho: 4, lip: 9 };
export function validarDistribucionMacros({ proPct, choPct, lipPct }) {
    const suma = round((num(proPct) ?? 0) + (num(choPct) ?? 0) + (num(lipPct) ?? 0), 1);
    return suma === 100
        ? { valido: true, suma, mensaje: null }
        : { valido: false, suma, mensaje: `La suma de macronutrientes debe ser 100% (actual: ${suma}%).` };
}
export function calcularMacros(get, { proPct, choPct, lipPct }) {
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
export function macrosEnRango({ proPct, choPct, lipPct }, etapa) {
    const r = rangosPorEtapa(etapa);
    const dentro = (v, [lo, hi]) => { const n = num(v); return n !== null && n >= lo && n <= hi; };
    return { pro: dentro(proPct, r.pro), cho: dentro(choPct, r.cho), lip: dentro(lipPct, r.lip) };
}

// ── 7. Diagnóstico ───────────────────────────────────────────────────────────
const ETAPA_REF_IMC = { adulto: "OMS", adulto_mayor: "MINSAL" };
const sexoTexto = (sexo) => {
    const s = normalizarSexo(sexo);
    return s === "M" ? "masculino" : s === "F" ? "femenino" : "no especificado";
};
export function generarDiagnostico(ev) {
    if (!ev) return "";
    const { etapa, edadTexto, sexo, antropometria: a = {}, energetico: en = {} } = ev;
    const etapaEdad = edadTexto ? `${etapa?.etiqueta || "Paciente"} de ${edadTexto}` : (etapa?.etiqueta || "Paciente");
    const encabezado = `${etapaEdad}, sexo ${sexoTexto(sexo)}`;
    let texto;
    if (a.imc?.valor != null && a.imc?.clasificacion) {
        const ref = ETAPA_REF_IMC[etapa?.etapa] || "OMS";
        texto = `${encabezado}, estado nutricional ${a.imc.clasificacion} según IMC (${ref}), IMC ${a.imc.valor} kg/m²`;
    } else texto = encabezado;
    const det = [];
    if (a.cintura?.clasificacion && a.cintura.clasificacion !== "Normal" && a.cintura?.valor != null) {
        const d = a.cintura.clasificacion === "Riesgo muy alto" ? "riesgo cardiovascular muy alto"
            : a.cintura.clasificacion === "Riesgo aumentado" ? "riesgo cardiovascular aumentado" : "riesgo cardiovascular";
        det.push(`${d} según perímetro de cintura (${a.cintura.valor} cm)`);
    }
    if (a.icc?.clasificacion && a.icc?.valor != null) det.push(`distribución ${a.icc.clasificacion.toLowerCase()} según ICC (${a.icc.valor})`);
    if (a.ica?.clasificacion === "Riesgo metabólico" && a.ica?.valor != null) det.push(`riesgo metabólico según ICA (${a.ica.valor})`);
    if (a.grasa?.valor != null && a.grasa?.clasificacion) det.push(`${a.grasa.clasificacion.toLowerCase()} de grasa corporal (${a.grasa.valor}%)`);
    if (a.cuello?.clasificacion === "Riesgo metabólico") det.push("riesgo metabólico según circunferencia de cuello");
    if (a.pantorrilla?.clasificacion === "Depleción de reservas proteicas") det.push("depleción de reservas proteicas según perímetro de pantorrilla");
    if (det.length) texto += `; presenta ${det.join(", ")}`;
    texto += ".";
    if (en.geb != null && en.get != null) texto += ` Requerimiento energético basal ${en.geb} kcal/día; total estimado ${en.get} kcal/día.`;
    return texto;
}

// ── Tablas energéticas pediátricas (Anexos 6 y 7 DINTA/MINSAL) ──────────────
const _TABLA_PEDIATRICO = [
    { eMin: 1.0,  eMax: 2.0,  H: 82, M: 80 }, { eMin: 2.0,  eMax: 3.0,  H: 84, M: 81 },
    { eMin: 3.0,  eMax: 4.0,  H: 80, M: 77 }, { eMin: 4.0,  eMax: 5.0,  H: 77, M: 74 },
    { eMin: 5.0,  eMax: 6.0,  H: 74, M: 72 }, { eMin: 6.0,  eMax: 7.0,  H: 73, M: 69 },
    { eMin: 7.0,  eMax: 8.0,  H: 71, M: 67 }, { eMin: 8.0,  eMax: 9.0,  H: 69, M: 64 },
    { eMin: 9.0,  eMax: 10.0, H: 67, M: 61 }, { eMin: 10.0, eMax: 11.0, H: 65, M: 58 },
    { eMin: 11.0, eMax: 12.0, H: 62, M: 56 }, { eMin: 12.0, eMax: 13.0, H: 60, M: 52 },
    { eMin: 13.0, eMax: 14.0, H: 58, M: 49 }, { eMin: 14.0, eMax: 15.0, H: 56, M: 47 },
    { eMin: 15.0, eMax: 16.0, H: 53, M: 46 }, { eMin: 16.0, eMax: 17.0, H: 52, M: 44 },
    { eMin: 17.0, eMax: 18.0, H: 50, M: 44 },
];
const _TABLA_LACTANTES = [
    { mMin: 0,  mMax: 1,  H: 113, M: 107 }, { mMin: 1,  mMax: 2,  H: 104, M: 101 },
    { mMin: 2,  mMax: 3,  H: 95,  M: 94  }, { mMin: 3,  mMax: 4,  H: 82,  M: 84  },
    { mMin: 4,  mMax: 5,  H: 81,  M: 82  }, { mMin: 5,  mMax: 6,  H: 81,  M: 81  },
    { mMin: 6,  mMax: 7,  H: 79,  M: 78  }, { mMin: 7,  mMax: 8,  H: 79,  M: 78  },
    { mMin: 8,  mMax: 9,  H: 79,  M: 78  }, { mMin: 9,  mMax: 10, H: 80,  M: 79  },
    { mMin: 10, mMax: 11, H: 80,  M: 79  }, { mMin: 11, mMax: 12, H: 81,  M: 79  },
];
const _FACTOR_ACT = { leve: 0.85, sedentario: 0.85, moderado: 1.0, moderada: 1.0, vigoroso: 1.15, vigorosa: 1.15 };

function _kcalKgDia(edadAnios, sexo) {
    const s = normalizarSexo(sexo);
    if (edadAnios < 1) {
        const mes = Math.floor(edadAnios * 12);
        const f = _TABLA_LACTANTES.find(r => mes >= r.mMin && mes < r.mMax);
        return f ? (s === 'M' ? f.H : f.M) : null;
    }
    const f = _TABLA_PEDIATRICO.find(r => edadAnios >= r.eMin && edadAnios <= r.eMax);
    return f ? (s === 'M' ? f.H : f.M) : null;
}

function _calcularGETPediatrico(edadAnios, sexo, pesoKg, actividadCategoria) {
    if (!pesoKg || edadAnios == null) return null;
    const kcalKg = _kcalKgDia(edadAnios, sexo);
    if (!kcalKg) return null;
    const factor = _FACTOR_ACT[actividadCategoria] ?? 1.0;
    return Math.round(pesoKg * kcalKg * factor);
}

/** Calcula edad biológica en años a partir del estadío de Tanner. */
export function calcularEdadBiologica(sexo, edadAnios, tannerGrado, fechaMenarquia) {
    const g = Number(tannerGrado);
    if (!g || !sexo) return null;
    const s = normalizarSexo(sexo);
    if (!s) return null;
    if (s === 'M') {
        if (g === 1) return edadAnios;
        if (g === 2) return 12.0;
        if (g === 3) return 12.5;
        if (g === 4) return 13.5;
        if (g === 5) return 14.5;
    } else {
        if (g === 1) return edadAnios;
        if (g === 2) return 10.5;
        if (g === 3) return 11.0;
        if (g === 4) return 12.0;
        if (g === 5) {
            const base = 12 + 8 / 12;
            if (fechaMenarquia) {
                const hoy = new Date();
                const men = new Date(fechaMenarquia);
                const meses = (hoy.getFullYear() - men.getFullYear()) * 12 + (hoy.getMonth() - men.getMonth());
                return base + Math.max(0, meses) / 12;
            }
            return base;
        }
    }
    return null;
}

// ── Orquestador ──────────────────────────────────────────────────────────────
export function evaluarPaciente(input = {}) {
    const sexo = input.sexo ?? null;
    const perimetros = input.perimetros || {};
    const pliegues = input.pliegues || {};
    const edadAnios = num(input.edadAnios);
    const etapa = determinarEtapa({ años: edadAnios, embarazada: !!input.embarazada, nodriza: !!input.nodriza });
    const edadTexto = edadAnios != null ? `${edadAnios} años` : null;

    const edadBiologicaAnios = num(input.edadBiologicaAnios);
    const usarEdadBio = edadBiologicaAnios != null && edadAnios != null && Math.abs(edadBiologicaAnios - edadAnios) > 1;
    const edadDecimal = usarEdadBio ? edadBiologicaAnios : edadAnios;

    const pesoActual = num(input.pesoActual);
    const tallaCm = num(input.tallaCm);

    const imc = calcularIMC(pesoActual, tallaCm);
    const iccVal = calcularICC(perimetros.cintura, perimetros.cadera);
    const icaVal = calcularICA(perimetros.cintura, tallaCm);
    const contexturaVal = indiceContextura(tallaCm, perimetros.muneca);
    const ppVal = porcentajePerdidaPeso(input.pesoHabitual, pesoActual);

    // % grasa según etapa
    let grasa;
    if (!etapa.esPediatrico) {
        const v = grasaFaulkner(pliegues, sexo);
        grasa = { valor: v, clasificacion: clasificarGrasa(v, sexo), metodo: v != null ? "Faulkner (Σ4)" : null };
    } else {
        const v = grasaSlaughter(pliegues, sexo, input.maduracion);
        grasa = { valor: v, clasificacion: null, metodo: v != null ? "Slaughter" : null };
    }

    const antropometria = {
        imc: { valor: imc, clasificacion: clasificarIMC(imc, etapa.etapa) },
        pesos: pesosReferencia(tallaCm, etapa.etapa, input.imcMeta),
        perdidaPeso: { valor: ppVal, clasificacion: clasificarPerdidaPeso(ppVal, input.periodoPP) },
        contextura: { valor: contexturaVal, clasificacion: clasificarContextura(contexturaVal, sexo) },
        cuello: { valor: num(perimetros.cuello), clasificacion: clasificarCuello(perimetros.cuello, sexo) },
        cintura: { valor: num(perimetros.cintura), clasificacion: clasificarCintura(perimetros.cintura, sexo, etapa.etapa) },
        ica: { valor: icaVal, clasificacion: clasificarICA(icaVal) },
        icc: { valor: iccVal, clasificacion: clasificarICC(iccVal, sexo) },
        pantorrilla: { valor: num(perimetros.pantorrilla), clasificacion: clasificarPantorrilla(perimetros.pantorrilla) },
        reservas: reservasBraquiales(perimetros.braquial, pliegues.tricipital),
        grasa,
    };

    const actividad = input.actividad || {};
    const palValor = num(actividad.pal) ?? palSugerido(actividad.categoria);
    let geb = calcularGEB({ pesoKg: pesoActual, edadAnios, sexo });
    const fp = input.hospitalizado ? num(input.fp) : null;
    let get = calcularGET(geb, palValor, fp);

    if (geb === null && etapa.esPediatrico) {
        const getPed = _calcularGETPediatrico(edadDecimal, sexo, pesoActual, actividad.categoria);
        if (getPed != null) get = getPed;
    }

    const energetico = {
        geb, pal: palValor, actividadCategoria: actividad.categoria ?? null,
        hospitalizado: !!input.hospitalizado, patologia: input.patologia ?? null, fp, get,
        edadBiologicaAnios: usarEdadBio ? edadBiologicaAnios : null,
    };

    const m = input.macros || sugeridoMacros(etapa.etapa);
    const macroPct = { proPct: m.proPct ?? m.pro, choPct: m.choPct ?? m.cho, lipPct: m.lipPct ?? m.lip };
    const macros = {
        distribucion: calcularMacros(get, macroPct),
        validacion: validarDistribucionMacros(macroPct),
        rangos: rangosPorEtapa(etapa.etapa),
        enRango: macrosEnRango(macroPct, etapa.etapa),
        sugerido: sugeridoMacros(etapa.etapa),
    };

    const resultado = { etapa, edadTexto, sexo, antropometria, energetico, macros };
    resultado.diagnostico = generarDiagnostico(resultado);
    return resultado;
}
