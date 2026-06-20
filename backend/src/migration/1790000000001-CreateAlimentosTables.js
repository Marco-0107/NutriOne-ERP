const { MigrationInterface, QueryRunner } = require("typeorm");

class CreateAlimentosTables1790000000001 {
    name = 'CreateAlimentosTables1790000000001'

    async up(queryRunner) {
        await queryRunner.query(`
            CREATE TABLE "categorias_alimento" (
                "id"     SERIAL NOT NULL,
                "nombre" character varying(150) NOT NULL,
                "icono"  character varying(10) NOT NULL DEFAULT '🍽️',
                CONSTRAINT "PK_categorias_alimento" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "alimentos" (
                "id"               SERIAL NOT NULL,
                "nombre"           character varying(200) NOT NULL,
                "energia_kcal"     numeric(8,1) NOT NULL DEFAULT 0,
                "proteinas_g"      numeric(6,2) NOT NULL DEFAULT 0,
                "carbohidratos_g"  numeric(6,2) NOT NULL DEFAULT 0,
                "grasas_g"         numeric(6,2) NOT NULL DEFAULT 0,
                "fibra_g"          numeric(6,2) NOT NULL DEFAULT 0,
                "sodio_mg"         numeric(8,1) NOT NULL DEFAULT 0,
                "id_categoria"     integer,
                CONSTRAINT "PK_alimentos" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "medidas_alimento" (
                "id"          SERIAL NOT NULL,
                "nombre"      character varying(150) NOT NULL,
                "gramos"      numeric(8,2) NOT NULL,
                "id_alimento" integer,
                CONSTRAINT "PK_medidas_alimento" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            ALTER TABLE "alimentos"
            ADD CONSTRAINT "FK_alimentos_categoria"
            FOREIGN KEY ("id_categoria")
            REFERENCES "categorias_alimento"("id")
            ON DELETE SET NULL ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "medidas_alimento"
            ADD CONSTRAINT "FK_medidas_alimento"
            FOREIGN KEY ("id_alimento")
            REFERENCES "alimentos"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`CREATE INDEX "IDX_alimentos_nombre" ON "alimentos" (lower("nombre"))`);
    }

    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_alimentos_nombre"`);
        await queryRunner.query(`ALTER TABLE "medidas_alimento" DROP CONSTRAINT IF EXISTS "FK_medidas_alimento"`);
        await queryRunner.query(`ALTER TABLE "alimentos" DROP CONSTRAINT IF EXISTS "FK_alimentos_categoria"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "medidas_alimento"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "alimentos"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "categorias_alimento"`);
    }
}

module.exports = { CreateAlimentosTables1790000000001 };
