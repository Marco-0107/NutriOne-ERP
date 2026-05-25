require("reflect-metadata");
const { DataSource } = require("typeorm");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../../.env") });

const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DATABASE || "nutrione_bd",
    synchronize: false, // Must be false when using migrations
    logging: true,
    entities: [path.join(__dirname, "../entity/**/*.js")],
    migrations: [path.join(__dirname, "../migration/**/*.js")],
    subscribers: [],
});

module.exports = AppDataSource;
