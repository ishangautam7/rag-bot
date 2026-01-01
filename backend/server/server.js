import 'dotenv/config';
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import authRoutes from "./src/routes/auth.routes.ts";
import chatRoutes from "./src/routes/chat.routes.ts";
// import sessionRoutes from "./src/routes/session.routes.ts";
// import messageRoutes from "./src/routes/message.routes.ts";
// import fileRoutes from "./src/routes/file.routes.ts";
// import shareRoutes from "./src/routes/share.routes.ts";
// import groupRoutes from "./src/routes/group.routes.ts";
import usageRoutes from "./src/routes/usage.route.ts";
import adminRoutes from "./src/routes/admin.routes.ts";
import { getSharedChat } from "./src/controller/share.controller.ts";
import { setSocketInstance } from "./src/services/socket.service.ts";

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "https://rag-chat-tau.vercel.app", "https://chat.ishan-gautam.com.np"],
        methods: ["GET", "POST", "PATCH", "DELETE"],
        credentials: true
    }
});

setSocketInstance(io);

io.on("connection", (socket) => {
    socket.on("join-session", (sessionId) => {
        socket.join(sessionId);
    });

    socket.on("leave-session", (sessionId) => {
        socket.leave(sessionId);
    });

    socket.on("disconnect", () => {
    });
});

export { io };

app.use(cors({
    origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "https://rag-chat-tau.vercel.app", "https://chat.ishan-gautam.com.np"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    preflightContinue: false,
    optionsSuccessStatus: 204
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
// app.use('/api/chat', chatRoutes); // The original commented out line
app.use('/api/chat', chatRoutes); // New aggregated route


app.use('/api/usage', usageRoutes);
app.use('/api/admin', adminRoutes);

// New feature routes
import folderRoutes from './src/routes/folder.routes.js';
import templateRoutes from './src/routes/template.routes.js';
app.use('/api/folders', folderRoutes);
app.use('/api/templates', templateRoutes);

// app.use('/uploads', express.static('uploads'));

httpServer.listen(4000, () => {
    console.log("Server is running on port 4000 with WebSocket support");
});

