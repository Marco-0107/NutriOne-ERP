const { MigrationInterface, QueryRunner } = require("typeorm");

class AddDuracionToDisponibilidad1780000000002 {
    async up(queryRunner) {
        await queryRunner.query(`
            ALTER TABLE disponibilidad
            ADD COLUMN IF NOT EXISTS duracion_minutos INTEGER NOT NULL DEFAULT 30
        `);
    }

    async down(queryRunner) {
        await queryRunner.query(`
            ALTER TABLE disponibilidad
            DROP COLUMN IF EXISTS duracion_minutos
        `);
    }
}

module.exports = { AddDuracionToDisponibilidad1780000000002 };
