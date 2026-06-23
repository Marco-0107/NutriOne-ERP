const { MigrationInterface, QueryRunner } = require("typeorm");

class AddTelefonoToPaciente1792000000000 {
    async up(queryRunner) {
        await queryRunner.query(`
            ALTER TABLE paciente
            ADD COLUMN IF NOT EXISTS telefono VARCHAR(20)
        `);
    }

    async down(queryRunner) {
        await queryRunner.query(`
            ALTER TABLE paciente
            DROP COLUMN IF EXISTS telefono
        `);
    }
}

module.exports = { AddTelefonoToPaciente1792000000000 };
