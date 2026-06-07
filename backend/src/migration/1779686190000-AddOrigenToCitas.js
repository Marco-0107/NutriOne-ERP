const { MigrationInterface, QueryRunner } = require("typeorm");

class AddOrigenToCitas1779686190000 {
    name = 'AddOrigenToCitas1779686190000'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "citas" ADD "origen" character varying(20) NOT NULL DEFAULT 'interna'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "citas" DROP COLUMN "origen"`);
    }
}

module.exports = { AddOrigenToCitas1779686190000 };
