import 'dotenv/config';
import express from "express";
import cors from "cors";
import authRoutes from "./src/routes/auth.routes.ts";
import chatRoutes from "./src/routes/chat.routes.ts";

const app = express();
app.use(express.json());

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
}));

app.get("/health", (req, res) => {
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
