// api/index.js - نسخة عامة ونظيفة
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.js";
import projectRoutes from "./routes/projects.js";
import jobRoutes from "./routes/jobs.js";
import applicationRoutes from "./routes/applications.js";
import userRoutes from "./routes/users.js";
import partnershipRoutes from "./routes/partnerships.js";
import reviewRoutes from "./routes/reviews.js";
import statsRoutes from "./routes/stats.js";
import ratingRoutes from "./routes/ratings.js";

dotenv.config();

const app = express();

// ====================== CORS عام (مؤقت) ======================
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");           // عام للكل
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  next();
});

app.use(express.json());
// Route مؤقت للاختبار - مهم
app.all("/api/*", (req, res) => {
  res.status(200).json({
    msg: "API route reached",
    path: req.path,
    method: req.method
  });
});
// ====================== MongoDB ======================
let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;

  try {
    await mongoose.connect(process.env.MONGO_URI);
    isConnected = true;
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err.message);
  }
};

app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// ====================== Routes ======================
app.get("/healthz", (req, res) => {
  res.status(200).json({ status: "OK", message: "Backend is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/users", userRoutes);
app.use("/api/partnerships", partnershipRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/ratings", ratingRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ msg: "Route not found" });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Global Error:", err);
  res.status(500).json({ msg: "Internal Server Error" });
});

export default app;