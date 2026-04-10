import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "node:dns/promises";

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

dns.setServers(["1.1.1.1", "8.8.8.8"]);

const app = express();

// ====================== CORS Middleware محسن لـ Vercel ======================
app.use((req, res, next) => {
  // السماح لـ localhost أثناء التطوير + Netlify عند النشر
  const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://startup-dz.netlify.app",           // غيريه برابط Netlify الحقيقي تاعك
    "https://prismatic-beignet-541326.netlify.app"
  ];

  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*"); // مؤقت للتجربة
  }

  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-CSRF-Token");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  // الرد على طلبات preflight (OPTIONS) - مهم جداً
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  next();
});

// ====================== باقي الإعدادات ======================
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// MongoDB Connection (محسن)
let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;

  try {
    const db = await mongoose.connect(process.env.MONGO_URI);
    isConnected = db.connections[0].readyState === 1;
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err.message);
  }
};

// Connect to DB before routes
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// Health Check
app.get("/healthz", (req, res) => {
  res.status(200).send("OK");
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/users", userRoutes);
app.use("/api/partnerships", partnershipRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/ratings", ratingRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Global Error:", err);
  res.status(500).json({ 
    msg: "Internal Server Error", 
    error: process.env.NODE_ENV === "development" ? err.message : "Something went wrong" 
  });
});

export default app;