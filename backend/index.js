require("reflect-metadata");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const AppDataSource = require("./src/config/data-source");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

// Health Check route
app.get("/", (req, res) => {
    res.json({
        message: "NutriOne-ERP API is running successfully!",
        db_status: AppDataSource.isInitialized ? "connected" : "disconnected"
    });
});

// Initialize Database Connection and start server
AppDataSource.initialize()
    .then(() => {
        console.log("Data Source has been initialized successfully!");
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error("Error during Data Source initialization:", err);
    });
