// Socket service for emitting real-time messages
// Import io from server.js when needed

let ioInstance: any = null;

export const setSocketInstance = (io: any) => {
    ioInstance = io;
};

export const getSocketInstance = () => {
    return ioInstance;
};

export const emitNewMessage = (sessionId: string, message: any) => {
    if (ioInstance) {
        ioInstance.to(sessionId).emit('new-message', {
            sessionId,
            message,
        });
        console.log(`Emitted new-message to session ${sessionId}`);
    }
};

export const emitUserJoined = (sessionId: string, user: any) => {
    if (ioInstance) {
        ioInstance.to(sessionId).emit('user-joined', {
            sessionId,
            user,
        });
    }
};

export const emitUserLeft = (sessionId: string, userId: string) => {
    if (ioInstance) {
        ioInstance.to(sessionId).emit('user-left', {
            sessionId,
            userId,
        });
    }
};
