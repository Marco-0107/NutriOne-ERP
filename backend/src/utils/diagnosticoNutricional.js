"use strict";

/**
 * Generador de diagnóstico nutricional (Sprint 4 — sección 7).
 * Produce un texto estructurado y clínico a partir de la evaluación ya calculada.
 * El nutricionista puede editarlo libremente antes de guardar.
 *
 * Formato:
 *   [Etapa] de [edad], sexo [x], estado nutricional [clasificación] según [indicador]
 *   ([referencia]), IMC [v] kg/m²; [+ índices: cintura/ICC/ICA, % grasa, reservas, depleción].
 */

const ETAPA_REFERENCIA_IMC = {
    adulto: "OMS",
    adulto_mayor: "MINSAL",
};

const sexoTexto = (sexo) => {
    const s = sexo ? String(sexo).trim().toLowerCase() : "";
    if (["m", "masculino", "hombre"].includes(s)) return "masculino";
    if (["f", "femenino", "mujer"].includes(s)) return "femenino";
    return "no especificado";
};

/**
 * @param {Object} ev resultado de evaluarPaciente()
 * @returns {string}
 */
function generarDiagnostico(ev) {
    if (!ev) return "";
    const { etapa, edadTexto, sexo, antropometria: a = {}, energetico: en = {} } = ev;

    const partes = [];

    // Encabezado: "[Etapa] de [edad], sexo [x]".
    const etapaEdad = edadTexto
        ? `${etapa?.etiqueta || "Paciente"} de ${edadTexto}`
        : (etapa?.etiqueta || "Paciente");
    const encabezado = `${etapaEdad}, sexo ${sexoTexto(sexo)}`;

    // Estado nutricional principal por IMC.
    if (a.imc?.valor != null && a.imc?.clasificacion) {
        const ref = ETAPA_REFERENCIA_IMC[etapa?.etapa] || "OMS";
        partes.push(
            `${encabezado}, estado nutricional ${a.imc.clasificacion} según IMC (${ref}), ` +
            `IMC ${a.imc.valor} kg/m²`
        );
    } else {
        partes.push(`${encabezado}`);
    }

    // Índices y reservas (solo lo que esté disponible).
    const detalles = [];

    if (a.cintura?.clasificacion && a.cintura.clasificacion !== "Normal" && a.cintura?.valor != null) {
        detalles.push(`${descCintura(a.cintura.clasificacion)} según perímetro de cintura (${a.cintura.valor} cm)`);
    }
    if (a.icc?.clasificacion && a.icc?.valor != null) {
        detalles.push(`distribución ${a.icc.clasificacion.toLowerCase()} según ICC (${a.icc.valor})`);
    }
    if (a.ica?.clasificacion === "Riesgo metabólico" && a.ica?.valor != null) {
        detalles.push(`riesgo metabólico según ICA (${a.ica.valor})`);
    }
    if (a.grasa?.valor != null && a.grasa?.clasificacion) {
        detalles.push(`${a.grasa.clasificacion.toLowerCase()} de grasa corporal (${a.grasa.valor}%)`);
    }
    if (a.cuello?.clasificacion === "Riesgo metabólico") {
        detalles.push("riesgo metabólico según circunferencia de cuello");
    }
    if (a.pantorrilla?.clasificacion === "Depleción de reservas proteicas") {
        detalles.push("depleción de reservas proteicas según perímetro de pantorrilla");
    }

    let texto = partes.join(" ");
    if (detalles.length) {
        texto += `; presenta ${detalles.join(", ")}`;
    }
    texto += ".";

    // Requerimiento energético, si está disponible.
    if (en.geb != null && en.get != null) {
        texto += ` Requerimiento energético basal ${en.geb} kcal/día; total estimado ${en.get} kcal/día.`;
    }

    return texto;
}

function descCintura(clasif) {
    if (clasif === "Riesgo muy alto") return "riesgo cardiovascular muy alto";
    if (clasif === "Riesgo aumentado") return "riesgo cardiovascular aumentado";
    return "riesgo cardiovascular";
}

module.exports = { generarDiagnostico };
