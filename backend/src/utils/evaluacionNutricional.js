"use strict";

/**
 * Orquestador de la evaluación nutricional (Sprint 4).
 *
 * Función pura `evaluarPaciente(input)` que arma TODOS los resultados a partir de
 * las mediciones. No toca la base de datos. La usan:
 *   - el endpoint POST /calculos/preview (cálculo en vivo sin guardar),
 *   - la persistencia (para derivar los campos calculados al guardar),
 *   - (espejada) el helper del frontend para el cálculo en vivo.
 *
 * Unidades de entrada: peso kg · talla cm · perímetros cm · pliegues mm.
 */

const antro = require("./calculosAntropometricos");
const energ = require("./calculosEnergeticos");
const { ETAPAS, calcularEdadExacta, edadEnMesesRedondeada, determinarEtapa } = require("./etapaCicloVital");
const { rangosPorEtapa, sugeridoMacros } = require("./referencias/rangosMacronutrientes");
const { generarDiagnostico } = require("./diagnosticoNutricional");
const { evaluarIndicador, evaluarPesoTalla } = require("./referencias/antropometriaPediatrica");
const {
    clasificarIMCEmbarazada,
    evaluarGananciaPeso,
    incrementoPonderalDiario,
    clasificarIncrementoPonderal,
} = require("./referencias/embarazoNeonato");

const num = (v) => {
    if (v === null || v === undefined || v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
};

/** Construye el texto de edad legible para el diagnóstico. */
function formatearEdad(edadExacta, edadAnios) {
    if (edadExacta) {
        const { años, meses, días, totalDias } = edadExacta;
        if (años >= 2) return `${años} años`;
        if (años === 1) return `1 año${meses ? ` ${meses} meses` : ""}`;
        if (meses >= 1) return `${meses} mes${meses > 1 ? "es" : ""}${días ? ` ${días} días` : ""}`;
        return `${totalDias} días`;
    }
    return edadAnios != null ? `${edadAnios} años` : null;
}

/**
 * @param {Object} input
 * @returns {Object} evaluación completa
 */
function evaluarPaciente(input = {}) {
    const notas = [];

    const sexo = input.sexo ?? null;
    const perimetros = input.perimetros || {};
    const pliegues = input.pliegues || {};

    // ── Edad y etapa ─────────────────────────────────────────────────────────
    const edadExacta = input.fechaNacimiento
        ? calcularEdadExacta(input.fechaNacimiento, input.fechaAtencion || new Date())
        : null;
    const edadAnios = edadExacta ? edadExacta.años : num(input.edadAnios);
    const etapa = determinarEtapa({
        edad: edadExacta,
        años: edadAnios,
        embarazada: !!input.embarazada,
        nodriza: !!input.nodriza,
    });
    const edadTexto = formatearEdad(edadExacta, edadAnios);

    const pesoActual = num(input.pesoActual);
    const tallaCm = num(input.tallaCm);

    // ── Antropometría ──────────────────────────────────────────────────────────
    const imc = antro.calcularIMC(pesoActual, tallaCm);
    const pesos = antro.pesosReferencia(tallaCm, etapa.etapa, input.imcMeta);

    const contexturaVal = antro.indiceContextura(tallaCm, perimetros.muneca);
    const iccVal = antro.calcularICC(perimetros.cintura, perimetros.cadera);
    const icaVal = antro.calcularICA(perimetros.cintura, tallaCm);
    const reservas = antro.reservasBraquiales(perimetros.braquial, pliegues.tricipital);

    // % grasa: método según etapa y pliegues disponibles.
    const grasa = calcularGrasa(etapa, pliegues, sexo, input.maduracion);

    const antropometria = {
        imc: { valor: imc, clasificacion: antro.clasificarIMC(imc, etapa.etapa) },
        pesos,
        perdidaPeso: {
            valor: antro.porcentajePerdidaPeso(input.pesoHabitual, pesoActual),
            clasificacion: antro.clasificarPerdidaPeso(
                antro.porcentajePerdidaPeso(input.pesoHabitual, pesoActual),
                input.periodoPP
            ),
        },
        contextura: { valor: contexturaVal, clasificacion: antro.clasificarContextura(contexturaVal, sexo) },
        cuello: { valor: num(perimetros.cuello), clasificacion: antro.clasificarCuello(perimetros.cuello, sexo) },
        cintura: { valor: num(perimetros.cintura), clasificacion: antro.clasificarCintura(perimetros.cintura, sexo) },
        ica: { valor: icaVal, clasificacion: antro.clasificarICA(icaVal) },
        icc: { valor: iccVal, clasificacion: antro.clasificarICC(iccVal, sexo) },
        pantorrilla: { valor: num(perimetros.pantorrilla), clasificacion: antro.clasificarPantorrilla(perimetros.pantorrilla) },
        reservas,
        grasa,
    };

    if (etapa.esPediatrico) {
        notas.push("Etapa pediátrica: el IMC se interpreta con IMC/E (percentil/Z), no con los cortes de adulto; ver bloque de indicadores pediátricos.");
    }
    if (antro.normalizarSexo(sexo) === null) {
        notas.push("Sexo no especificado: las clasificaciones por sexo (cintura, ICC, % grasa, etc.) no se calculan.");
    }

    // ── Requerimiento energético ───────────────────────────────────────────────
    const actividad = input.actividad || {};
    const palValor = num(actividad.pal) ?? energ.palSugerido(actividad.categoria);
    const geb = energ.calcularGEB({ pesoKg: pesoActual, edadAnios, sexo });
    const fp = input.hospitalizado ? num(input.fp) : null;
    const get = energ.calcularGET(geb, palValor, fp);

    if (geb === null && edadAnios != null && edadAnios < 18) {
        notas.push("GEB no calculado: las ecuaciones FAO del documento cubren solo edad ≥ 18 años.");
    }

    const energetico = {
        geb,
        pal: palValor,
        actividadCategoria: actividad.categoria ?? null,
        hospitalizado: !!input.hospitalizado,
        patologia: input.patologia ?? null,
        fp,
        get,
    };

    // ── Macronutrientes ────────────────────────────────────────────────────────
    const macrosInput = input.macros || sugeridoMacros(etapa.etapa);
    const distribucion = energ.calcularMacros(get, {
        proPct: macrosInput.proPct ?? macrosInput.pro,
        choPct: macrosInput.choPct ?? macrosInput.cho,
        lipPct: macrosInput.lipPct ?? macrosInput.lip,
    });
    const validacion = energ.validarDistribucionMacros({
        proPct: macrosInput.proPct ?? macrosInput.pro,
        choPct: macrosInput.choPct ?? macrosInput.cho,
        lipPct: macrosInput.lipPct ?? macrosInput.lip,
    });
    const macros = {
        distribucion,
        validacion,
        rangos: rangosPorEtapa(etapa.etapa),
        enRango: energ.macrosEnRango({
            proPct: macrosInput.proPct ?? macrosInput.pro,
            choPct: macrosInput.choPct ?? macrosInput.cho,
            lipPct: macrosInput.lipPct ?? macrosInput.lip,
        }, etapa.etapa),
        sugerido: sugeridoMacros(etapa.etapa),
    };

    // ── Indicadores pediátricos (P/E, T/E, P/T, IMC/E, PCe/E) ────────────────
    let pediatria = null;
    if (etapa.esPediatrico) {
        // Edad en meses con redondeo MINSAL (≥15 días = +1 mes).
        const edadMeses = edadExacta
            ? edadEnMesesRedondeada(edadExacta)
            : (num(input.edadMeses) ?? (edadAnios != null ? edadAnios * 12 : null));

        const pe = evaluarIndicador("peso_edad", sexo, edadMeses, pesoActual);
        const te = evaluarIndicador("talla_edad", sexo, edadMeses, tallaCm);
        const imcE = evaluarIndicador("imc_edad", sexo, edadMeses, imc);
        const pt = evaluarPesoTalla(sexo, edadMeses, tallaCm, pesoActual);

        pediatria = {
            edadMeses,
            peso_edad: pe,
            talla_edad: te,
            imc_edad: imcE,
            peso_talla: pt,
            calificacion: calificacionNutricional(edadMeses, pe, pt, imcE),
        };
        if (![pe, te, imcE, pt].some((r) => r && r.disponible)) {
            notas.push("Indicadores pediátricos no disponibles: faltan tablas de referencia (ver backend/src/data/README.md).");
        }
    }

    // ── Embarazada / nodriza ──────────────────────────────────────────────────
    let embarazo = null;
    if (input.embarazada || input.nodriza) {
        embarazo = {
            clasificacionIMC: clasificarIMCEmbarazada(imc),
            ganancia: evaluarGananciaPeso({
                pesoActual,
                pesoPregestacional: input.pesoPregestacional,
                imcPregestacional: input.imcPregestacional,
            }),
        };
    }

    // ── Recién nacido — incremento ponderal ──────────────────────────────────
    let neonato = null;
    if (input.neonato) {
        const gDia = incrementoPonderalDiario(input.neonato);
        neonato = { gramosPorDia: gDia, clasificacion: clasificarIncrementoPonderal(gDia) };
    }

    // ── Diagnóstico generado ─────────────────────────────────────────────────
    const resultado = {
        etapa,
        edad: edadExacta,
        edadTexto,
        sexo,
        antropometria,
        energetico,
        macros,
        pediatria,
        embarazo,
        neonato,
        notas,
    };
    resultado.diagnostico = generarDiagnostico(resultado);

    return resultado;
}

/** Selecciona la fórmula de % grasa según etapa y pliegues disponibles. */
function calcularGrasa(etapa, pliegues, sexo, maduracion) {
    // Adulto / adulto mayor / embarazada / nodriza → Faulkner (Σ4).
    if (!etapa.esPediatrico) {
        const valor = antro.grasaFaulkner({
            tricipital: pliegues.tricipital,
            subescapular: pliegues.subescapular,
            supraespinal: pliegues.supraespinal,
            abdominal: pliegues.abdominal,
        }, sexo);
        return { valor, clasificacion: antro.clasificarGrasa(valor, sexo), metodo: valor != null ? "Faulkner (Σ4)" : null };
    }
    // Pediátrico → Slaughter (tricipital + subescapular).
    const slaughter = antro.grasaSlaughter({
        tricipital: pliegues.tricipital,
        subescapular: pliegues.subescapular,
    }, sexo, maduracion);
    if (slaughter != null) {
        return { valor: slaughter, clasificacion: null, metodo: "Slaughter" };
    }
    // Alternativa pediátrica: densidad Brook/Lohman (4 pliegues).
    const brook = antro.grasaBrookLohman({
        tricipital: pliegues.tricipital,
        bicipital: pliegues.bicipital,
        subescapular: pliegues.subescapular,
        supraespinal: pliegues.supraespinal,
    }, sexo);
    return { valor: brook, clasificacion: null, metodo: brook != null ? "Brook/Lohman (densidad)" : null };
}

/**
 * Calificación nutricional pediátrica según el indicador que corresponde a la edad
 * (MINSAL): < 1 año → P/E (con prioridad de P/T si hay exceso ≥ +1DE);
 * 1 a 5 años → P/T; > 5 años 1 mes → IMC/E.
 */
function calificacionNutricional(edadMeses, pe, pt, imc) {
    if (edadMeses == null) return null;
    if (edadMeses < 12) {
        if (pt && pt.disponible && pt.z != null && pt.z >= 1) {
            return { indicador: "P/T", z: pt.z, clasificacion: pt.clasificacion };
        }
        if (pe && pe.disponible) {
            const clasif = (pe.z != null && pe.z >= 1) ? "Normal" : pe.clasificacion;
            return { indicador: "P/E", z: pe.z, clasificacion: clasif };
        }
        return null;
    }
    if (edadMeses < 61) {
        return pt && pt.disponible ? { indicador: "P/T", z: pt.z, clasificacion: pt.clasificacion } : null;
    }
    return imc && imc.disponible ? { indicador: "IMC/E", z: imc.z, clasificacion: imc.clasificacion } : null;
}

module.exports = { evaluarPaciente, ETAPAS };
