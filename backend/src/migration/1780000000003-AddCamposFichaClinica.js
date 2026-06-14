const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class AddCamposFichaClinica1780000000003 {
    async up(queryRunner) {
        // Datos personales adicionales
        await queryRunner.query(`ALTER TABLE ficha_clinica ADD COLUMN IF NOT EXISTS nombre_social VARCHAR(200) NULL`);
        await queryRunner.query(`ALTER TABLE ficha_clinica ADD COLUMN IF NOT EXISTS sexo VARCHAR(30) NULL`);

        // Datos de atención adicionales
        await queryRunner.query(`ALTER TABLE ficha_clinica ADD COLUMN IF NOT EXISTS presion_arterial VARCHAR(20) NULL`);
        await queryRunner.query(`ALTER TABLE ficha_clinica ADD COLUMN IF NOT EXISTS circunferencia_cintura NUMERIC(5,2) NULL`);

        // Conclusiones adicionales
        await queryRunner.query(`ALTER TABLE ficha_clinica ADD COLUMN IF NOT EXISTS recomendaciones TEXT NULL`);
        await queryRunner.query(`ALTER TABLE ficha_clinica ADD COLUMN IF NOT EXISTS derivaciones TEXT NULL`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE ficha_clinica DROP COLUMN IF EXISTS nombre_social`);
        await queryRunner.query(`ALTER TABLE ficha_clinica DROP COLUMN IF EXISTS sexo`);
        await queryRunner.query(`ALTER TABLE ficha_clinica DROP COLUMN IF EXISTS presion_arterial`);
        await queryRunner.query(`ALTER TABLE ficha_clinica DROP COLUMN IF EXISTS circunferencia_cintura`);
        await queryRunner.query(`ALTER TABLE ficha_clinica DROP COLUMN IF EXISTS recomendaciones`);
        await queryRunner.query(`ALTER TABLE ficha_clinica DROP COLUMN IF EXISTS derivaciones`);
    }
};
