import 'dotenv/config';
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import authRoutes from "./src/routes/auth.routes.ts";
import chatRoutes from "./src/routes/chat.routes.ts";
import usageRoutes from "./src/routes/usage.route.ts";
import { getSharedChat } from "./src/controller/share.controller.ts";
import { setSocketInstance } from "./src/services/socket.service.ts";

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "https://rag-chat-tau.vercel.app", "https://chat.ishan-gautam.com.np"],
        methods: ["GET", "POST"],
        credentials: true
    }
});

setSocketInstance(io);

io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("join-session", (sessionId) => {
        socket.join(sessionId);
        console.log(`Socket ${socket.id} joined session ${sessionId}`);
    });

    socket.on("leave-session", (sessionId) => {
        socket.leave(sessionId);
        console.log(`Socket ${socket.id} left session ${sessionId}`);
    });

    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
    });
});

export { io };

app.use(cors({
    origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "https://rag-chat-tau.vercel.app", "https://chat.ishan-gautam.com.np"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());

app.get("/health", (req, res) => {
    console.log("Health check");
    res.json({
        success: true,
        message: "Server is running",
        timestamp: new Date().toISOString(),
    });
});

app.get('/api/shared/:token', getSharedChat);

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/usage', usageRoutes);

httpServer.listen(4000, () => {
    console.log("Server is running on port 4000 with WebSocket support");
});

