"use strict";
const { Server } = require("socket.io");

let io = null;

// Un único servidor de sockets, sin salas/autenticación: los eventos que emite
// son un aviso minimo (ids/fecha) para que los clientes refresquen su propia
// vista ya autorizada, nunca datos sensibles del paciente.
const initSocket = (server) => {
    io = new Server(server, {
        cors: { origin: "*" },
    });

    return io;
};

const emitCitaEvent = (event, payload) => {
    if (!io) return;
    io.emit(event, payload);
};

module.exports = { initSocket, emitCitaEvent };
