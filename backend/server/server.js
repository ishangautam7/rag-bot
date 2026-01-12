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
import contactRoutes from "./src/routes/contact.routes.ts";
import { getSharedChat } from "./src/controller/share.controller.ts";

const app = express();

app.use(express.json());
app.use(cors({
    origin: "http://localhost:3000",
    credentials: true,
}))
app.get('/api/shared/:token', getSharedChat);

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);


app.use('/api/usage', usageRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contact', contactRoutes);


import folderRoutes from './src/routes/folder.routes.ts';
import templateRoutes from './src/routes/template.routes.ts';
app.use('/api/folders', folderRoutes);
app.use('/api/templates', templateRoutes);

// app.use('/uploads', express.static('uploads'));

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

httpServer.listen(4000, () => {
    console.log("Server is running on port 4000 with WebSocket support");
});

