// NOTIFICATION STEP 4: SHARE THE SOCKET.IO SERVER WITHOUT IMPORTING index.js
// This prevents circular dependencies when feature helpers need io.to(...).emit(...).

let io = null;

// Controllers should not import index.js directly because that would create a
// circular dependency. index.js stores the Socket.IO server here once at boot.
export const setIO = (socketServer) => {
    io = socketServer;
};

export const getIO = () => {
    if (!io) {
        throw new Error("Socket.IO has not been initialized");
    }

    return io;
};
