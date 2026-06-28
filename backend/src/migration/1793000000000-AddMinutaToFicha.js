const { MigrationInterface, QueryRunner } = require("typeorm");

class AddMinutaToFicha1793000000000 {
    name = 'AddMinutaToFicha1793000000000'

    async up(queryRunner) {
        await queryRunner.query(`
            ALTER TABLE "ficha_clinica"
            ADD COLUMN IF NOT EXISTS "minuta" jsonb
        `);
    }

    async down(queryRunner) {
        await queryRunner.query(`
            ALTER TABLE "ficha_clinica"
            DROP COLUMN IF EXISTS "minuta"
        `);
    }
}

module.exports = { AddMinutaToFicha1793000000000 };
