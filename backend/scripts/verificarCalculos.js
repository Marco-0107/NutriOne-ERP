"use strict";

/**
 * Verificación de las fórmulas de cálculo nutricional (Sprint 4).
 *
 * Ejecuta el caso clínico de validación (sección 16 del documento maestro) y
 * compara contra los resultados esperados. No requiere framework de pruebas:
 *
 *     node scripts/verificarCalculos.js
 *
 * Nota: la sección 16 contiene un par de erratas respecto a las fórmulas del
 * "contrato" (secciones 4–8). Donde el número esperado no concuerda con la
 * fórmula declarada, se verifica contra la fórmula (que es la fuente de verdad)
 * y se deja constancia de la discrepancia.
 */

const antro = require("../src/utils/calculosAntropometricos");
const energ = require("../src/utils/calculosEnergeticos");
const { evaluarPaciente } = require("../src/utils/evaluacionNutricional");
const lms = require("../src/utils/referencias/lms");
const eyn = require("../src/utils/referencias/embarazoNeonato");
const ped = require("../src/utils/referencias/antropometriaPediatrica");
const { edadEnMesesRedondeada } = require("../src/utils/etapaCicloVital");

let pasaron = 0;
let fallaron = 0;

function check(nombre, real, esperado, tol = 0.05) {
    let ok;
    if (typeof esperado === "number") {
        ok = real != null && Math.abs(real - esperado) <= tol;
    } else {
        ok = real === esperado;
    }
    if (ok) {
        pasaron++;
        console.log(`  ✓ ${nombre}: ${real}`);
    } else {
        fallaron++;
        console.log(`  ✗ ${nombre}: obtenido=${real} esperado=${esperado} (tol ±${tol})`);
    }
}

console.log("\n=== Caso de validación §16: Mujer, 36 años, 71.6 kg, 1.82 m ===\n");

const caso = {
    sexo: "Femenino",
    edadAnios: 36,
    pesoActual: 71.6,
    tallaCm: 182,
    perimetros: { braquial: 35.2, cuello: 34, muneca: 14.8, pantorrilla: 39.4, cintura: 99, cadera: 109 },
    pliegues: { tricipital: 28, bicipital: 13, subescapular: 22, crestaIliaca: 31, supraespinal: 18, abdominal: 29 },
    actividad: { categoria: "sedentario", pal: 1.55 },
    macros: { proPct: 15, choPct: 55, lipPct: 30 },
};

const ev = evaluarPaciente(caso);
const a = ev.antropometria;

console.log("[Antropometría]");
check("IMC", a.imc.valor, 21.6, 0.1);
check("Clasificación IMC", a.imc.clasificacion, "Normal");
check("ICC", a.icc.valor, 0.908, 0.002);
check("Clasificación ICC", a.icc.clasificacion, "Androide");
check("ICA", a.ica.valor, 0.54, 0.01);
check("Clasificación ICA", a.ica.clasificacion, "Riesgo metabólico");
check("Clasificación cintura", a.cintura.clasificacion, "Riesgo muy alto");
check("Contextura (índice)", a.contextura.valor, 12.3, 0.1);
check("Clasificación contextura", a.contextura.clasificacion, "Pequeña");
check("Clasificación pantorrilla", a.pantorrilla.clasificacion, "Sin depleción");

console.log("\n[Reservas braquiales] (tolerancia ±2 por orden de redondeo del doc)");
check("CMB (mm)", a.reservas.cmb, 264.0, 0.5);
check("AMB (mm²)", a.reservas.amb, 5546.2, 2);
check("AB (mm²)", a.reservas.ab, 9859.96, 2);
check("AGB (mm²)", a.reservas.agb, 4313.7, 2);

console.log("\n[% Grasa] (fórmula §4.11A Faulkner Σ4 — el 36.4% de §16 es errata)");
const sigma4 = 28 + 22 + 18 + 29; // tricipital+subescapular+supraespinal+abdominal
check("Σ4", sigma4, 97, 0);
check("% grasa Faulkner (0.213·97+7.9)", a.grasa.valor, 28.6, 0.1);

console.log("\n[Energético] GEB FAO 2004 mujer 30–59: 8.126·P + 845.6");
check("GEB (kcal)", ev.energetico.geb, 1427, 1);
check("GET = GEB×1.55 (kcal)", ev.energetico.get, 2212, 2);

console.log("\n[Macros] GET 2212 · PRO15/CHO55/LIP30");
check("Suma macros = 100", ev.macros.validacion.suma, 100, 0);
check("Macros válidos", ev.macros.validacion.valido, true);
check("g PRO (GET·0.15/4)", ev.macros.distribucion.pro.gramos, 83.0, 0.2);
check("g CHO (GET·0.55/4)", ev.macros.distribucion.cho.gramos, 304.2, 0.3);
check("g LIP (GET·0.30/9)", ev.macros.distribucion.lip.gramos, 73.7, 0.2);

console.log("\n[Etapa y diagnóstico]");
check("Etapa", ev.etapa.etapa, "adulto");
console.log(`  → Diagnóstico generado:\n    "${ev.diagnostico}"`);

// ── Casos extra: cortes de clasificación ────────────────────────────────────
console.log("\n=== Cortes de clasificación (adulto vs adulto mayor) ===\n");
check("IMC 17 adulto", antro.clasificarIMC(17, "adulto"), "Bajo peso");
check("IMC 22 adulto", antro.clasificarIMC(22, "adulto"), "Normal");
check("IMC 27 adulto", antro.clasificarIMC(27, "adulto"), "Sobrepeso");
check("IMC 32 adulto", antro.clasificarIMC(32, "adulto"), "Obesidad Tipo 1");
check("IMC 41 adulto", antro.clasificarIMC(41, "adulto"), "Obesidad Tipo 3");
check("IMC 22 adulto mayor", antro.clasificarIMC(22, "adulto_mayor"), "Bajo peso");
check("IMC 25 adulto mayor", antro.clasificarIMC(25, "adulto_mayor"), "Normal");
check("IMC 33 adulto mayor", antro.clasificarIMC(33, "adulto_mayor"), "Obesidad");

console.log("\n=== GEB hombre 18–30: 15.057·P + 692.2 (P=70) ===\n");
check("GEB hombre 25a 70kg", energ.calcularGEB({ pesoKg: 70, edadAnios: 25, sexo: "Masculino" }), 15.057 * 70 + 692.2, 1);

console.log("\n=== Motor LMS / Z-score (Fase 5) ===\n");
// X = M → Z = 0 exacto
check("Z(X=M) = 0", lms.zScoreLMS(16.0, { L: -1.2, M: 16.0, S: 0.08 }), 0, 0.001);
// Caso L=0: Z = ln(X/M)/S ; X=M·e^(S) → Z=1
check("Z(L=0, X=M·e^S) = 1", lms.zScoreLMS(16 * Math.exp(0.08), { L: 0, M: 16, S: 0.08 }), 1, 0.02);
// Percentil de Z=0 es 50
check("percentil(Z=0) = 50", lms.percentilDesdeZ(0), 50, 0.2);
check("percentil(Z=1.645) ≈ 95", lms.percentilDesdeZ(1.645), 95, 0.5);
// Interpolación lineal de M entre dos filas
const lmsInterp = lms.interpolarLMS([{ x: 60, L: -1, M: 15, S: 0.08 }, { x: 72, L: -1, M: 15.6, S: 0.08 }], 66);
check("interpolarLMS M(66m)", lmsInterp ? Number(lmsInterp.M.toFixed(2)) : null, 15.3, 0.001);
check("clasificarZ imc_edad (Z=1.5 → Sobrepeso)", lms.clasificarZ(1.5, "imc_edad"), "Sobrepeso");
check("clasificarZ imc_edad (Z=2.5 → Obesidad)", lms.clasificarZ(2.5, "imc_edad"), "Obesidad");
check("clasificarZ imc_edad (Z=3.5 → Obesidad severa)", lms.clasificarZ(3.5, "imc_edad"), "Obesidad severa");
check("clasificarZ talla_edad (Z=-2.5 → Talla baja)", lms.clasificarZ(-2.5, "talla_edad"), "Talla baja");
check("clasificarZ peso_talla (Z=-1.5 → Riesgo de desnutrir)", lms.clasificarZ(-1.5, "peso_talla"), "Riesgo de desnutrir");

console.log("\n=== Embarazo (IOM) y Recién Nacido ===\n");
check("Ganancia peso normal (IMC 22)", eyn.gananciaPesoRecomendada(22).categoria, "Normal");
check("  → rango min", eyn.gananciaPesoRecomendada(22).min, 11.5, 0);
check("  → rango max", eyn.gananciaPesoRecomendada(22).max, 16, 0);
check("Ganancia peso obesidad (IMC 32)", eyn.gananciaPesoRecomendada(32).categoria, "Obesidad");
check("Clasif IMC embarazada 26", eyn.clasificarIMCEmbarazada(26), "Sobrepeso");
check("Incremento RN 25 g/día", eyn.clasificarIncrementoPonderal(25), "Buen incremento ponderal");
check("Incremento RN 15 g/día", eyn.clasificarIncrementoPonderal(15), "Mal incremento ponderal");
check("g/día (3.0→3.3 kg en 15 d)", eyn.incrementoPonderalDiario({ pesoInicialKg: 3.0, pesoFinalKg: 3.3, dias: 15 }), 20, 0.1);

console.log("\n=== Cálculos auxiliares §8 (estimación talla/peso, amputado, talla diana) ===\n");
const aux = require("../src/utils/calculosAuxiliares");
check("Talla Chumlea H (TR=50, 70a)", aux.tallaChumlea(50, 70, "Masculino"), 2.02 * 50 - 0.04 * 70 + 64.19, 0.1);
check("Talla Rabito F (MB=80, 36a)", aux.tallaRabito(80, 36, "Femenino"), 63.525 - 3.237 * 2 - 0.06904 * 36 + 1.293 * 80, 0.1);
check("Peso AM F (CB28 CP33 PCS18 AR50)", aux.estimarPesoAdultoMayor({ cb: 28, cp: 33, pcs: 18, ar: 50 }, "Femenino"), 57.7, 0.1);
check("Peso ideal amputado (10% de 70)", aux.pesoIdealAmputado(70, 10), 63, 0.01);
check("Talla diana niño (P170 M160)", aux.tallaDiana(170, 160, "Masculino"), 171.5, 0.01);
check("Talla diana niña (P170 M160)", aux.tallaDiana(170, 160, "Femenino"), 158.5, 0.01);
check("Edad corregida (EPN 4, EG 32)", aux.edadCorregidaSemanas(4, 32), 4 - (40 - 32), 0.01);

console.log("\n=== Redondeo de edad MINSAL (≥15 días = +1 mes) ===\n");
check("7a 1m 14d → 85 meses", edadEnMesesRedondeada({ años: 7, meses: 1, días: 14 }), 85, 0);
check("7a 1m 15d → 86 meses", edadEnMesesRedondeada({ años: 7, meses: 1, días: 15 }), 86, 0);
check("2a 0m 0d → 24 meses", edadEnMesesRedondeada({ años: 2, meses: 0, días: 0 }), 24, 0);

console.log("\n=== Pediatría con tablas MINSAL ===\n");
ped._resetCache();
const tablasMINSAL = ped.hayTablasPediatricas();
console.log(`  (tablas pediátricas cargadas: ${tablasMINSAL})`);
const evPed = evaluarPaciente({ sexo: "Masculino", edadAnios: 7, pesoActual: 24, tallaCm: 124 });
check("etapa escolar", evPed.etapa.etapa, "escolar");
check("pediatría presente", evPed.pediatria != null, true);
check("GEB null para <18", evPed.energetico.geb, null);
if (tablasMINSAL) {
    const z0 = ped.evaluarIndicador("imc_edad", "M", 61, 15.2641);
    check("IMC/E en la mediana → Z≈0", z0.z, 0, 0.1);
    const sob = ped.evaluarIndicador("imc_edad", "M", 120, 25);
    check("IMC 25 a 10a → Sobrepeso/Obesidad", ["Sobrepeso", "Obesidad", "Obesidad severa"].includes(sob.clasificacion), true);
    // P/T sub-tabla por edad
    const pt = ped.evaluarPesoTalla("M", 36, 95, 14);
    check("P/T (3a, 95cm) disponible", pt.disponible, true);
    check("P/T usa sub-tabla estatura", pt.subtabla, "estatura");
    // Calificación nutricional por edad: lactante 8 meses
    const evLact = evaluarPaciente({ sexo: "Femenino", edadAnios: 0, edadMeses: 8, pesoActual: 8.0, tallaCm: 70 });
    check("calificación <1a usa P/E o P/T", ["P/E", "P/T"].includes(evLact.pediatria.calificacion?.indicador), true);
} else {
    check("sin tabla → disponible:false (seguro)", ped.evaluarIndicador("imc_edad", "M", 72, 15.5).disponible, false);
}

console.log(`\n${"=".repeat(50)}`);
console.log(`RESULTADO: ${pasaron} pasaron, ${fallaron} fallaron`);
console.log(`${"=".repeat(50)}\n`);

process.exit(fallaron > 0 ? 1 : 0);
