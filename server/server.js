import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import "dotenv/config";

import authRoutes from "./routes/authRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import emergencyRoutes from "./routes/emergencyRoutes.js";
import familyRoutes from "./routes/familyRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";
import healthToolRoutes from "./routes/healthToolRoutes.js";
import hospitalRoutes from "./routes/hospitalRoutes.js";
import medicineRoutes from "./routes/medicineRoutes.js";
import predictionRoutes from "./routes/predictionRoutes.js";
import prescriptionRoutes from "./routes/prescriptionRoutes.js";
import smsRoutes from "./routes/smsRoutes.js";
import { startSmsCron } from "./services/smsCron.js";

const app = express();
const PORT = Number(process.env.PORT || 5000);

app.use(
  cors({
    origin: [
      process.env.CLIENT_URL,
      "http://localhost:5173",
      "https://sehat-9mfh.onrender.com",
    ],
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));

app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/predict", predictionRoutes);
app.use("/api/prescription", prescriptionRoutes);
app.use("/api/emergency", emergencyRoutes);
app.use("/api/hospitals", hospitalRoutes);
app.use("/api/health", healthRoutes);
app.use("/api/medicines", medicineRoutes);
app.use("/api/family", familyRoutes);
app.use("/api/health-tools", healthToolRoutes);
app.use("/api/sms", smsRoutes);

app.get("/api/health-check", (_req, res) => {
  res.json({ status: "ok", service: "SehatSaathi API", port: PORT });
});

const MONGO_URI = process.env.MONGO_URI;
if (MONGO_URI) {
  mongoose
    .connect(MONGO_URI)
    .then(() => {
      console.log("MongoDB connected");
      startSmsCron();
    })
    .catch((error) =>
      console.log(`MongoDB connection failed: ${error.message}`),
    );
}

app.listen(PORT, () => {
  console.log(`SehatSaathi API listening on port ${PORT}`);
});

export default app;
