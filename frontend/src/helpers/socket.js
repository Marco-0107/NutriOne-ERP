import { io } from 'socket.io-client';
import { apiBaseUrl } from './api';

// El servidor de sockets vive en la raíz del backend (no bajo /api).
const socketUrl = apiBaseUrl.replace(/\/api$/, '') || '/';

let socket = null;

export const getSocket = () => {
    if (!socket) {
        socket = io(socketUrl, { autoConnect: true, transports: ['websocket', 'polling'] });
    }
    return socket;
};
