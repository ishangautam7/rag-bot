import 'dotenv/config';
import express from "express";
import cors from "cors";
import authRoutes from "./src/routes/auth.routes.ts";
import chatRoutes from "./src/routes/chat.routes.ts";

const app = express();

// CORS - must be before other middleware
app.use(cors({
    origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],
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

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

app.listen(4000, () => {
    console.log("Server is running on port 4000");
});
