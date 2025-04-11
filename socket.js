const { Server } = require('socket.io');

let ioInstance = null;

module.exports = {
    init: (server) => {
        ioInstance = new Server(server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });
        return ioInstance;
    },
    getIO: () => {
        if (!ioInstance) {
            throw new Error('Socket.IO no ha sido inicializado');
        }
        return ioInstance;
    }
};
