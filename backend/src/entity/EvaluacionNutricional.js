const { EntitySchema } = require("typeorm");

/**
 * EvaluacionNutricional (Sprint 4)
 *
 * Guarda las mediciones antropométricas (inputs) y los resultados calculados
 * (outputs) de la sección "Cálculos" de una atención médica. Relación 1:1 con
 * FichaClinica → permite no recalcular y dar historial por paciente
 * (ficha → cita → paciente) para el módulo de evolución.
 *
 * Unidades: peso/longitudes en cm o kg según corresponda; pliegues en mm;
 * energía en kcal/día.
 */
module.exports = new EntitySchema({
    name: "EvaluacionNutricional",
    tableName: "evaluacion_nutricional",
    columns: {
        id: { primary: true, type: "int", generated: true },

        etapa_ciclo_vital: { type: "varchar", length: 40, nullable: true },

        // ── Mediciones (inputs) ──────────────────────────────────────────────
        peso_actual:   { type: "numeric", precision: 6, scale: 2, nullable: true },
        peso_habitual: { type: "numeric", precision: 6, scale: 2, nullable: true },
        talla:         { type: "numeric", precision: 6, scale: 2, nullable: true },

        perimetro_muneca:     { type: "numeric", precision: 6, scale: 2, nullable: true },
        perimetro_cintura:    { type: "numeric", precision: 6, scale: 2, nullable: true },
        perimetro_cadera:     { type: "numeric", precision: 6, scale: 2, nullable: true },
        perimetro_cuello:     { type: "numeric", precision: 6, scale: 2, nullable: true },
        perimetro_pantorrilla:{ type: "numeric", precision: 6, scale: 2, nullable: true },
        perimetro_braquial:   { type: "numeric", precision: 6, scale: 2, nullable: true },
        perimetro_cefalico:   { type: "numeric", precision: 6, scale: 2, nullable: true },

        pliegue_tricipital:   { type: "numeric", precision: 5, scale: 2, nullable: true },
        pliegue_bicipital:    { type: "numeric", precision: 5, scale: 2, nullable: true },
        pliegue_subescapular: { type: "numeric", precision: 5, scale: 2, nullable: true },
        pliegue_cresta_iliaca:{ type: "numeric", precision: 5, scale: 2, nullable: true },
        pliegue_supraespinal: { type: "numeric", precision: 5, scale: 2, nullable: true },
        pliegue_abdominal:    { type: "numeric", precision: 5, scale: 2, nullable: true },

        // ── Resultados antropométricos (outputs) ─────────────────────────────
        imc:              { type: "numeric", precision: 5, scale: 2, nullable: true },
        clasificacion_imc:{ type: "varchar", length: 60, nullable: true },
        peso_ideal:   { type: "numeric", precision: 6, scale: 2, nullable: true },
        peso_minimo:  { type: "numeric", precision: 6, scale: 2, nullable: true },
        peso_maximo:  { type: "numeric", precision: 6, scale: 2, nullable: true },
        peso_meta:    { type: "numeric", precision: 6, scale: 2, nullable: true },
        porcentaje_perdida_peso: { type: "numeric", precision: 5, scale: 2, nullable: true },

        contextura:               { type: "varchar", length: 30, nullable: true },
        clasificacion_cuello:     { type: "varchar", length: 40, nullable: true },
        clasificacion_cintura:    { type: "varchar", length: 40, nullable: true },
        clasificacion_pantorrilla:{ type: "varchar", length: 60, nullable: true },

        icc: { type: "numeric", precision: 5, scale: 3, nullable: true },
        clasificacion_icc: { type: "varchar", length: 30, nullable: true },
        ica: { type: "numeric", precision: 5, scale: 2, nullable: true },
        clasificacion_ica: { type: "varchar", length: 40, nullable: true },

        cmb: { type: "numeric", precision: 8, scale: 2, nullable: true },
        amb: { type: "numeric", precision: 9, scale: 2, nullable: true },
        agb: { type: "numeric", precision: 9, scale: 2, nullable: true },

        porcentaje_grasa:    { type: "numeric", precision: 5, scale: 2, nullable: true },
        clasificacion_grasa: { type: "varchar", length: 30, nullable: true },
        metodo_grasa:        { type: "varchar", length: 40, nullable: true },

        // ── Energético ───────────────────────────────────────────────────────
        nivel_actividad:  { type: "varchar", length: 30, nullable: true },
        pal:              { type: "numeric", precision: 4, scale: 2, nullable: true },
        es_hospitalizado: { type: "boolean", default: false },
        patologia:        { type: "varchar", length: 80, nullable: true },
        fp:               { type: "numeric", precision: 4, scale: 2, nullable: true },
        geb:              { type: "numeric", precision: 7, scale: 2, nullable: true },
        get:              { type: "numeric", precision: 7, scale: 2, nullable: true },

        // ── Macronutrientes (deben sumar 100%) ───────────────────────────────
        pro_porcentaje: { type: "numeric", precision: 5, scale: 2, nullable: true },
        pro_gramos:     { type: "numeric", precision: 7, scale: 2, nullable: true },
        cho_porcentaje: { type: "numeric", precision: 5, scale: 2, nullable: true },
        cho_gramos:     { type: "numeric", precision: 7, scale: 2, nullable: true },
        lip_porcentaje: { type: "numeric", precision: 5, scale: 2, nullable: true },
        lip_gramos:     { type: "numeric", precision: 7, scale: 2, nullable: true },

        // ── Diagnóstico generado (editable luego en la ficha) ────────────────
        diagnostico_generado: { type: "text", nullable: true },

        // ── Meta ─────────────────────────────────────────────────────────────
        fecha_creacion:      { name: "fecha_creacion", type: "timestamp with time zone", createDate: true },
        fecha_actualizacion: { name: "fecha_actualizacion", type: "timestamp with time zone", updateDate: true },
    },
    relations: {
        ficha: {
            type: "one-to-one",
            target: "FichaClinica",
            joinColumn: { name: "id_ficha" },
            onDelete: "CASCADE",
            nullable: false,
        },
    },
});
