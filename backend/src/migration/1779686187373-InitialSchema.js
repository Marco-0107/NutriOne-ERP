const { MigrationInterface, QueryRunner } = require("typeorm");

class InitialSchema1779686187373 {
    name = 'InitialSchema1779686187373'

    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "usuario_rol" ("id_usuario_rol" SERIAL NOT NULL, "fecha_asignacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "estado" character varying(50) NOT NULL DEFAULT 'activo', "id_usuario" integer, "id_rol" integer, CONSTRAINT "PK_ca713aaaeccf9816b62b41ebdcb" PRIMARY KEY ("id_usuario_rol"))`);
        await queryRunner.query(`CREATE TABLE "usuarios" ("id" SERIAL NOT NULL, "rut" character varying(20) NOT NULL, "nombres" character varying(150) NOT NULL, "apellido_paterno" character varying(100) NOT NULL, "apellido_materno" character varying(100) NOT NULL, "correo" character varying(150) NOT NULL, "contrasena" character varying(255) NOT NULL, "estado" character varying(50) NOT NULL DEFAULT 'activo', "fecha_creacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "fecha_actualizacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_9e90b993976dcd8bdabf4e3159d" UNIQUE ("rut"), CONSTRAINT "UQ_63665765c1a778a770c9bd585d3" UNIQUE ("correo"), CONSTRAINT "PK_d7281c63c176e152e4c531594a8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "transacciones" ("id_transaccion" SERIAL NOT NULL, "monto" numeric(10,2) NOT NULL, "metodo_pago" character varying(100) NOT NULL, "estado_pago" character varying(50) NOT NULL DEFAULT 'pendiente', "fecha_pago" TIMESTAMP WITH TIME ZONE, "codigo_transaccion" character varying(150), "id_cita" integer, CONSTRAINT "UQ_d13653cf404bf26171dc4a1c14b" UNIQUE ("codigo_transaccion"), CONSTRAINT "PK_3d65786d464d04432ea34e03fb6" PRIMARY KEY ("id_transaccion"))`);
        await queryRunner.query(`CREATE TABLE "servicios" ("id" SERIAL NOT NULL, "nombre" character varying(150) NOT NULL, "descripcion" text, "precio" numeric(10,2) NOT NULL, "duracion_minutos" integer NOT NULL, "estado" character varying(50) NOT NULL DEFAULT 'activo', "id_user" integer, CONSTRAINT "PK_fefcdbfeaf506ca485a6dcfb0d8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "roles" ("id_rol" SERIAL NOT NULL, "nombre" character varying(100) NOT NULL, "descripcion" character varying(255), "estado" character varying(50) NOT NULL DEFAULT 'activo', "fecha_creacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "fecha_actualizacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_a5be7aa67e759e347b1c6464e10" UNIQUE ("nombre"), CONSTRAINT "PK_25f8d4161f00a1dd1cbe5068695" PRIMARY KEY ("id_rol"))`);
        await queryRunner.query(`CREATE TABLE "rol_permiso" ("id_rol_permiso" SERIAL NOT NULL, "fecha_asignacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "estado" character varying(50) NOT NULL DEFAULT 'activo', "id_rol" integer, "id_permiso" integer, CONSTRAINT "PK_151312cfdb886f6d9dc19f9ccfd" PRIMARY KEY ("id_rol_permiso"))`);
        await queryRunner.query(`CREATE TABLE "permisos" ("id_permiso" SERIAL NOT NULL, "nombre" character varying(100) NOT NULL, "codigo" character varying(100) NOT NULL, "descripcion" character varying(255), "modulo" character varying(100) NOT NULL, "estado" character varying(50) NOT NULL DEFAULT 'activo', "fecha_creacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "fecha_actualizacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_40d964f2742b2f4e3f379d3f460" UNIQUE ("codigo"), CONSTRAINT "PK_76e2dbb965cd631705b6caaf698" PRIMARY KEY ("id_permiso"))`);
        await queryRunner.query(`CREATE TABLE "paciente" ("id" SERIAL NOT NULL, "fecha_nacimiento" date NOT NULL, "prevision" character varying(100), "id_user" integer, CONSTRAINT "REL_d776f7065cc32eb9da73bf850e" UNIQUE ("id_user"), CONSTRAINT "PK_cbcb7985432e4b49d32c5243867" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "ficha_clinica" ("id_ficha" SERIAL NOT NULL, "tipo" character varying(50) NOT NULL, "fecha_atencion" date NOT NULL, "edad" integer NOT NULL, "peso" numeric(5,2), "talla" numeric(5,2), "calculos" text, "diagnostico_nutricional" text, "motivo_consulta" text, "observacion" text, "indicaciones" text, "estado" character varying(50) NOT NULL DEFAULT 'activo', "fecha_creacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "fecha_actualizacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "id_cita" integer, CONSTRAINT "REL_d0bc488dbaa4fa97bc5da62de4" UNIQUE ("id_cita"), CONSTRAINT "PK_b9f1ea0f42ccff6175aaee43711" PRIMARY KEY ("id_ficha"))`);
        await queryRunner.query(`CREATE TABLE "disponibilidad" ("id_disponibilidad" SERIAL NOT NULL, "dia_semana" character varying(50) NOT NULL, "hora_inicio" TIME NOT NULL, "hora_fin" TIME NOT NULL, "estado" character varying(50) NOT NULL DEFAULT 'activo', "id_user" integer, CONSTRAINT "PK_66105d7f699da39809f9deb4445" PRIMARY KEY ("id_disponibilidad"))`);
        await queryRunner.query(`CREATE TABLE "citas" ("id_cita" SERIAL NOT NULL, "fecha" date NOT NULL, "hora_inicio" TIME NOT NULL, "hora_fin" TIME NOT NULL, "estado" character varying(50) NOT NULL DEFAULT 'pendiente', "motivo_cancelacion" character varying(255), "fecha_creacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "fecha_actualizacion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "observacion" text, "id_paciente" integer, "id_usuario" integer, "id_servicio" integer, CONSTRAINT "PK_48281f29cd96b16aea361c58fa7" PRIMARY KEY ("id_cita"))`);
        await queryRunner.query(`ALTER TABLE "usuario_rol" ADD CONSTRAINT "FK_6adca3617fc69b2864e67196f2a" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "usuario_rol" ADD CONSTRAINT "FK_96d2a6ecb2ad0931416610845cf" FOREIGN KEY ("id_rol") REFERENCES "roles"("id_rol") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transacciones" ADD CONSTRAINT "FK_9375e73c0c5731ca86183846a8a" FOREIGN KEY ("id_cita") REFERENCES "citas"("id_cita") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "servicios" ADD CONSTRAINT "FK_f350dcf9703de99dad1ad27d7f5" FOREIGN KEY ("id_user") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rol_permiso" ADD CONSTRAINT "FK_1d9e5be3d74310f98e398912d94" FOREIGN KEY ("id_rol") REFERENCES "roles"("id_rol") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "rol_permiso" ADD CONSTRAINT "FK_9c0fd212b970f71bf0a9465c4f3" FOREIGN KEY ("id_permiso") REFERENCES "permisos"("id_permiso") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "paciente" ADD CONSTRAINT "FK_d776f7065cc32eb9da73bf850e9" FOREIGN KEY ("id_user") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ficha_clinica" ADD CONSTRAINT "FK_d0bc488dbaa4fa97bc5da62de43" FOREIGN KEY ("id_cita") REFERENCES "citas"("id_cita") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "disponibilidad" ADD CONSTRAINT "FK_3c390f03a3009a31b84fae0ccf9" FOREIGN KEY ("id_user") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "citas" ADD CONSTRAINT "FK_a8d064f479f7059b411c109a570" FOREIGN KEY ("id_paciente") REFERENCES "paciente"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "citas" ADD CONSTRAINT "FK_e143566abee4656c45bba5b21b5" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "citas" ADD CONSTRAINT "FK_e6ae9e926e0bdd8cd7ba70fb041" FOREIGN KEY ("id_servicio") REFERENCES "servicios"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "citas" DROP CONSTRAINT "FK_e6ae9e926e0bdd8cd7ba70fb041"`);
        await queryRunner.query(`ALTER TABLE "citas" DROP CONSTRAINT "FK_e143566abee4656c45bba5b21b5"`);
        await queryRunner.query(`ALTER TABLE "citas" DROP CONSTRAINT "FK_a8d064f479f7059b411c109a570"`);
        await queryRunner.query(`ALTER TABLE "disponibilidad" DROP CONSTRAINT "FK_3c390f03a3009a31b84fae0ccf9"`);
        await queryRunner.query(`ALTER TABLE "ficha_clinica" DROP CONSTRAINT "FK_d0bc488dbaa4fa97bc5da62de43"`);
        await queryRunner.query(`ALTER TABLE "paciente" DROP CONSTRAINT "FK_d776f7065cc32eb9da73bf850e9"`);
        await queryRunner.query(`ALTER TABLE "rol_permiso" DROP CONSTRAINT "FK_9c0fd212b970f71bf0a9465c4f3"`);
        await queryRunner.query(`ALTER TABLE "rol_permiso" DROP CONSTRAINT "FK_1d9e5be3d74310f98e398912d94"`);
        await queryRunner.query(`ALTER TABLE "servicios" DROP CONSTRAINT "FK_f350dcf9703de99dad1ad27d7f5"`);
        await queryRunner.query(`ALTER TABLE "transacciones" DROP CONSTRAINT "FK_9375e73c0c5731ca86183846a8a"`);
        await queryRunner.query(`ALTER TABLE "usuario_rol" DROP CONSTRAINT "FK_96d2a6ecb2ad0931416610845cf"`);
        await queryRunner.query(`ALTER TABLE "usuario_rol" DROP CONSTRAINT "FK_6adca3617fc69b2864e67196f2a"`);
        await queryRunner.query(`DROP TABLE "citas"`);
        await queryRunner.query(`DROP TABLE "disponibilidad"`);
        await queryRunner.query(`DROP TABLE "ficha_clinica"`);
        await queryRunner.query(`DROP TABLE "paciente"`);
        await queryRunner.query(`DROP TABLE "permisos"`);
        await queryRunner.query(`DROP TABLE "rol_permiso"`);
        await queryRunner.query(`DROP TABLE "roles"`);
        await queryRunner.query(`DROP TABLE "servicios"`);
        await queryRunner.query(`DROP TABLE "transacciones"`);
        await queryRunner.query(`DROP TABLE "usuarios"`);
        await queryRunner.query(`DROP TABLE "usuario_rol"`);
    }
}

module.exports = { InitialSchema1779686187373 };
