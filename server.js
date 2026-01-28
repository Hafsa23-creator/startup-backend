import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.js";
import projectRoutes from "./routes/projects.js";
import jobRoutes from "./routes/jobs.js";
import applicationRoutes from "./routes/applications.js";
import userRoutes from "./routes/users.js";
import partnershipRoutes from "./routes/partnerships.js";
import reviewRoutes from "./routes/reviews.js";

dotenv.config();

const app = express();

// حل CORS يدوي + قوي جدًا (يحل مشكل redirect/pre-flight على Render)
app.use((req, res, next) => {
  const origin = req.headers.origin;

  // نحدد الـ origins المسموحة (يمكنك إضافة رابط Netlify لاحقًا)
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    // 'https://your-netlify-app.netlify.app' // أضيفيه لاحقًا
  ];

  // نرد الـ header لكل الطلبات
  res.header('Access-Control-Allow-Origin', allowedOrigins.includes(origin) ? origin : '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');

  // التعامل مع OPTIONS (preflight) بدون أي redirect
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});

// باقي الـ middlewares
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Atlas connected ✅"))
  .catch(err => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1); // يوقف السيرفر إذا فشل الاتصال
  });

// Health Check (مهم لـ Render)
app.get("/healthz", (req, res) => res.status(200).send("OK"));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/users", userRoutes);
app.use("/api/partnerships", partnershipRoutes);
app.use("/api/reviews", reviewRoutes);

// Start server
console.log("Trying to listen on port:", process.env.PORT || 5000);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});