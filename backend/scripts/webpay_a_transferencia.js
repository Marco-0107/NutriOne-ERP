"use strict";
/**
 * Cambia el método de pago de TODAS las transacciones 'webpay' a 'transferencia'.
 *
 * Uso: DB_HOST=146.83.198.35 DB_PORT=5432 DB_USERNAME=mcerda \
 *      DB_PASSWORD=mcerda1201 DATABASE=nutrione_db node webpay_a_transferencia.js
 */
const { Client } = require("pg");

async function main() {
    const client = new Client({
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || "5432"),
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DATABASE,
    });
    await client.connect();

    try {
        const antes = await client.query(
            "SELECT metodo_pago, COUNT(*) AS n FROM transacciones GROUP BY metodo_pago ORDER BY metodo_pago"
        );
        console.log("Antes:", antes.rows.map((r) => `${r.metodo_pago}=${r.n}`).join(" · "));

        const res = await client.query(
            "UPDATE transacciones SET metodo_pago = 'transferencia' WHERE lower(metodo_pago) = 'webpay'"
        );
        console.log(`Actualizadas ${res.rowCount} transacciones webpay → transferencia.`);

        const despues = await client.query(
            "SELECT metodo_pago, COUNT(*) AS n FROM transacciones GROUP BY metodo_pago ORDER BY metodo_pago"
        );
        console.log("Después:", despues.rows.map((r) => `${r.metodo_pago}=${r.n}`).join(" · "));
    } finally {
        await client.end();
    }
}

main().catch((e) => { console.error(e); process.exit(1); });
