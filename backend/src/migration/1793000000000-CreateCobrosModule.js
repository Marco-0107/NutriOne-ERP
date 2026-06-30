const { MigrationInterface, QueryRunner } = require("typeorm");

class CreateCobrosModule1793000000000 {
    name = "CreateCobrosModule1793000000000";

    async up(queryRunner) {
        // ─── 1. Tabla cobros (uno por cita realizada) ───
        await queryRunner.query(`
            CREATE TABLE "cobros" (
                "id_cobro"            SERIAL        NOT NULL,
                "monto_total"         NUMERIC(10,2) NOT NULL,
                "monto_pagado"        NUMERIC(10,2) NOT NULL DEFAULT 0,
                "estado"              VARCHAR(30)   NOT NULL DEFAULT 'pendiente',
                "notas"               TEXT,
                "fecha_creacion"      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "fecha_actualizacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "id_cita"             INTEGER       NOT NULL,
                CONSTRAINT "PK_cobros" PRIMARY KEY ("id_cobro"),
                CONSTRAINT "UQ_cobros_cita" UNIQUE ("id_cita"),
                CONSTRAINT "FK_cobros_cita"
                    FOREIGN KEY ("id_cita")
                    REFERENCES "citas"("id_cita")
                    ON DELETE CASCADE
            )
        `);

        // Índices de acceso frecuente
        await queryRunner.query(`
            CREATE INDEX "IDX_cobros_estado" ON "cobros" ("estado")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_cobros_fecha_creacion" ON "cobros" ("fecha_creacion")
        `);

        // ─── 2. Ampliar transacciones: vincular al cobro + campo notas ───
        await queryRunner.query(`
            ALTER TABLE "transacciones"
                ADD COLUMN IF NOT EXISTS "id_cobro" INTEGER
                    REFERENCES "cobros"("id_cobro") ON DELETE CASCADE,
                ADD COLUMN IF NOT EXISTS "notas" TEXT
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_transacciones_cobro" ON "transacciones" ("id_cobro")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_transacciones_fecha_pago" ON "transacciones" ("fecha_pago")
        `);

        // ─── 3. Limpiar transacciones huérfanas del flujo anterior ───
        await queryRunner.query(`
            DELETE FROM "transacciones" WHERE "metodo_pago" = 'Por definir'
        `);
    }

    async down(queryRunner) {
        // Revertir índices de transacciones
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_transacciones_fecha_pago"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_transacciones_cobro"`);

        // Revertir columnas añadidas a transacciones
        await queryRunner.query(`ALTER TABLE "transacciones" DROP COLUMN IF EXISTS "notas"`);
        await queryRunner.query(`ALTER TABLE "transacciones" DROP COLUMN IF EXISTS "id_cobro"`);

        // Revertir índices de cobros
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_cobros_fecha_creacion"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_cobros_estado"`);

        // Revertir tabla cobros
        await queryRunner.query(`DROP TABLE IF EXISTS "cobros"`);
    }
}

module.exports = { CreateCobrosModule1793000000000 };
