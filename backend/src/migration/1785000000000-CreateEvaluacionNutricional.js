const { MigrationInterface, QueryRunner } = require("typeorm");

/**
 * Crea la tabla evaluacion_nutricional (Sprint 4 — Cálculos Nutricionales).
 * Relación 1:1 con ficha_clinica (id_ficha UNIQUE, ON DELETE CASCADE).
 */
module.exports = class CreateEvaluacionNutricional1785000000000 {
    async up(queryRunner) {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS evaluacion_nutricional (
                id SERIAL PRIMARY KEY,
                etapa_ciclo_vital VARCHAR(40) NULL,

                peso_actual   NUMERIC(6,2) NULL,
                peso_habitual NUMERIC(6,2) NULL,
                talla         NUMERIC(6,2) NULL,

                perimetro_muneca      NUMERIC(6,2) NULL,
                perimetro_cintura     NUMERIC(6,2) NULL,
                perimetro_cadera      NUMERIC(6,2) NULL,
                perimetro_cuello      NUMERIC(6,2) NULL,
                perimetro_pantorrilla NUMERIC(6,2) NULL,
                perimetro_braquial    NUMERIC(6,2) NULL,
                perimetro_cefalico    NUMERIC(6,2) NULL,

                pliegue_tricipital    NUMERIC(5,2) NULL,
                pliegue_bicipital     NUMERIC(5,2) NULL,
                pliegue_subescapular  NUMERIC(5,2) NULL,
                pliegue_cresta_iliaca NUMERIC(5,2) NULL,
                pliegue_supraespinal  NUMERIC(5,2) NULL,
                pliegue_abdominal     NUMERIC(5,2) NULL,

                imc               NUMERIC(5,2) NULL,
                clasificacion_imc VARCHAR(60) NULL,
                peso_ideal  NUMERIC(6,2) NULL,
                peso_minimo NUMERIC(6,2) NULL,
                peso_maximo NUMERIC(6,2) NULL,
                peso_meta   NUMERIC(6,2) NULL,
                porcentaje_perdida_peso NUMERIC(5,2) NULL,

                contextura                VARCHAR(30) NULL,
                clasificacion_cuello      VARCHAR(40) NULL,
                clasificacion_cintura     VARCHAR(40) NULL,
                clasificacion_pantorrilla VARCHAR(60) NULL,

                icc NUMERIC(5,3) NULL,
                clasificacion_icc VARCHAR(30) NULL,
                ica NUMERIC(5,2) NULL,
                clasificacion_ica VARCHAR(40) NULL,

                cmb NUMERIC(8,2) NULL,
                amb NUMERIC(9,2) NULL,
                agb NUMERIC(9,2) NULL,

                porcentaje_grasa    NUMERIC(5,2) NULL,
                clasificacion_grasa VARCHAR(30) NULL,
                metodo_grasa        VARCHAR(40) NULL,

                nivel_actividad  VARCHAR(30) NULL,
                pal              NUMERIC(4,2) NULL,
                es_hospitalizado BOOLEAN NOT NULL DEFAULT FALSE,
                patologia        VARCHAR(80) NULL,
                fp               NUMERIC(4,2) NULL,
                geb              NUMERIC(7,2) NULL,
                get              NUMERIC(7,2) NULL,

                pro_porcentaje NUMERIC(5,2) NULL,
                pro_gramos     NUMERIC(7,2) NULL,
                cho_porcentaje NUMERIC(5,2) NULL,
                cho_gramos     NUMERIC(7,2) NULL,
                lip_porcentaje NUMERIC(5,2) NULL,
                lip_gramos     NUMERIC(7,2) NULL,

                diagnostico_generado TEXT NULL,

                fecha_creacion      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                fecha_actualizacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

                id_ficha INTEGER NOT NULL UNIQUE,
                CONSTRAINT fk_evaluacion_ficha
                    FOREIGN KEY (id_ficha) REFERENCES ficha_clinica(id_ficha) ON DELETE CASCADE
            )
        `);
    }

    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE IF EXISTS evaluacion_nutricional`);
    }
};
