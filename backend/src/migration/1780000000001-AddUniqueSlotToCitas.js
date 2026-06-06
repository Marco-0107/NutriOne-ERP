const { MigrationInterface, QueryRunner } = require("typeorm");

class AddUniqueSlotToCitas1780000000001 {
    name = 'AddUniqueSlotToCitas1780000000001'

    async up(queryRunner) {
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_citas_nutricionista_fecha_hora" ON "citas" (id_usuario, (fecha + hora_inicio))`);
    }

    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "UQ_citas_nutricionista_fecha_hora"`);
    }
}

module.exports = { AddUniqueSlotToCitas1780000000001 };
