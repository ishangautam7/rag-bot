import express from "express";
import authRoutes from "./src/routes/auth.routes";
import chatRoutes from "./src/routes/chat.routes";

const app = express();
app.use(express.json());

app.get("/health", (req, res) => {
    res.json({
        success: true,
        message: "Server is running",
        timestamp: new Date().toISOString(),
    });
});

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

app.listen(5000, () => {
    console.log("Server is running on port 3000");
});
