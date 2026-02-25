import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import "dotenv/config";

import chatRoutes from "./routes/chatRoutes.js";
import predictionRoutes from "./routes/predictionRoutes.js";
import prescriptionRoutes from "./routes/prescriptionRoutes.js";
import emergencyRoutes from "./routes/emergencyRoutes.js";
import hospitalRoutes from "./routes/hospitalRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json({ limit: "10mb" }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/predict", predictionRoutes);
app.use("/api/prescription", prescriptionRoutes);
app.use("/api/emergency", emergencyRoutes);
app.use("/api/hospitals", hospitalRoutes);
app.use("/api/health", healthRoutes);

app.get("/api/health-check", (_req, res) =>
  res.json({ status: "ok", service: "SehatSaathi API" })
);

// MongoDB
const MONGO_URI = process.env.MONGO_URI;
if (MONGO_URI) {
  mongoose
    .connect(MONGO_URI)
    .then(() => console.log("✅ MongoDB connected"))
    .catch((err) => console.log("⚠️ MongoDB:", err.message));
}

app.listen(PORT, () => console.log(`🏥 SehatSaathi API on port ${PORT}`));
