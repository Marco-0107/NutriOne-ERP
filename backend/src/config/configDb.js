"use strict";
require("reflect-metadata");
const path = require("path");
const { DataSource } = require("typeorm");
const { DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DATABASE } = require("./configEnv");

/**
 * Fuente de datos TypeORM.
 * Toda la configuración sale de configEnv, que a su vez lee el .env.
 */
const AppDataSource = new DataSource({
    type:        "postgres",
    host:        DB_HOST,
    port:        DB_PORT,
    username:    DB_USERNAME,
    password:    DB_PASSWORD,
    database:    DATABASE,
    synchronize: false,
    logging:     false,
    entities:    [path.join(__dirname, "../entity/**/*.js")],
    migrations:  [path.join(__dirname, "../migration/**/*.js")],
    subscribers: [],
});

/**
 * Inicializa la conexión a la base de datos.
 * Si falla, imprime el error y detiene el proceso.
 */
async function connectDB() {
    try {
        await AppDataSource.initialize();
        console.log("=> Conexión exitosa a la base de datos!");
    } catch (error) {
        console.error("[FATAL] Error al conectar con la base de datos:", error.message);
        process.exit(1);
    }
}

module.exports = { AppDataSource, connectDB };
