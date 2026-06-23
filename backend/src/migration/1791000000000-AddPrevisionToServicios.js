const { MigrationInterface, QueryRunner } = require("typeorm");

class AddPrevisionToServicios1791000000000 {
    async up(queryRunner) {
        await queryRunner.query(`
            ALTER TABLE servicios
            ADD COLUMN IF NOT EXISTS prevision VARCHAR(50) NOT NULL DEFAULT 'particular'
        `);
    }

    async down(queryRunner) {
        await queryRunner.query(`
            ALTER TABLE servicios
            DROP COLUMN IF EXISTS prevision
        `);
    }
}

module.exports = { AddPrevisionToServicios1791000000000 };
