"use strict";
require("reflect-metadata");

// configEnv DEBE cargarse primero: valida y exporta todas las variables de entorno.
// Si alguna falta, el proceso termina aquí con un mensaje claro.
const { HOST, PORT } = require("./src/config/configEnv");
const { AppDataSource } = require("./src/config/configDb");
const { seedDatabase }  = require("./src/config/seeds");
const { connectRedis }  = require("./src/config/redisClient");

const express = require("express");
const cors    = require("cors");
const morgan  = require("morgan");

// Inicializar Passport (registra la estrategia JWT)
require("./src/auth/passport.auth");

const apiRouter = require("./src/routes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Rutas principales de la API
app.use("/api", apiRouter);

// Health check
app.get("/", (req, res) => {
    res.json({
        message:   "NutriOne-ERP API corriendo correctamente.",
        db_status: AppDataSource.isInitialized ? "conectada" : "desconectada",
        host:      HOST,
        port:      PORT,
    });
});

// Inicializar base de datos y levantar servidor
AppDataSource.initialize()
    .then(async () => {
        console.log("=> Conexión exitosa a la base de datos!");

        await seedDatabase(AppDataSource);

        // Conectar Redis (no bloqueante: si falla, la app sigue sin caché)
        await connectRedis();

        app.listen(PORT, () => {
            console.log(`=> Servidor corriendo en http://${HOST}:${PORT}`);
        });
    })
    .catch((err) => {
        console.error("[FATAL] Error al inicializar la base de datos:", err.message);
        process.exit(1);
    });
