const { MigrationInterface, QueryRunner } = require("typeorm");

class FixPartialUniqueSlotCitas1780000000003 {
    name = 'FixPartialUniqueSlotCitas1780000000003'

    async up(queryRunner) {
        await queryRunner.query(`DROP INDEX IF EXISTS "UQ_citas_nutricionista_fecha_hora"`);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "UQ_citas_nutricionista_fecha_hora"
            ON "citas" (id_usuario, (fecha + hora_inicio))
            WHERE estado != 'cancelada'
        `);
    }

    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX IF EXISTS "UQ_citas_nutricionista_fecha_hora"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_citas_nutricionista_fecha_hora" ON "citas" (id_usuario, (fecha + hora_inicio))`);
    }
}

module.exports = { FixPartialUniqueSlotCitas1780000000003 };
