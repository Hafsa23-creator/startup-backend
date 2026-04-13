// api/index.js - نسخة محسّنة
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

// Load environment variables
dotenv.config();

const app = express();

// ============================================
// CORS Middleware
// ============================================
app.use((req, res, next) => {
  const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://startup-dz.netlify.app",
    "https://prismatic-beignet-541326.netlify.app"
  ];

  const origin = req.headers.origin;

  // السماح للـ origins المحددة
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    // أو السماح للكل (مؤقت للتطوير)
    res.setHeader("Access-Control-Allow-Origin", "*");
  }

  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-CSRF-Token");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  // Handle preflight
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  next();
});

// ============================================
// Body Parser Middleware
// ============================================
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ============================================
// MongoDB Connection
// ============================================
let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    return;
  }

  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined in environment variables");
    }

    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    await mongoose.connect(process.env.MONGO_URI, options);
    isConnected = mongoose.connection.readyState === 1;
    
    console.log("✅ MongoDB Connected Successfully");
    console.log(`📊 Database: ${mongoose.connection.name}`);
    
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err.message);
    isConnected = false;
    
    // إعادة المحاولة بعد 5 ثواني
    setTimeout(connectDB, 5000);
  }
};

// MongoDB Event Listeners
mongoose.connection.on('connected', () => {
  console.log('🔗 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
  isConnected = false;
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ Mongoose disconnected');
  isConnected = false;
});

// Graceful Shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('👋 MongoDB connection closed');
  process.exit(0);
});

// Connect to database on middleware
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// ============================================
// Request Logger (Development)
// ============================================
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// ============================================
// Health Check & Info Routes
// ============================================
app.get("/", (req, res) => {
  res.json({
    status: "OK",
    message: "Startup API is running",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    database: isConnected ? "Connected" : "Disconnected",
    endpoints: {
      health: "/healthz",
      auth: "/api/auth",
      projects: "/api/projects",
      jobs: "/api/jobs",
      applications: "/api/applications",
      users: "/api/users",
      partnerships: "/api/partnerships",
      reviews: "/api/reviews",
      stats: "/api/stats",
      ratings: "/api/ratings"
    }
  });
});

app.get("/healthz", (req, res) => {
  res.status(200).json({
    status: "healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: isConnected ? "connected" : "disconnected",
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || "development"
  });
});

// ============================================
// API Routes
// ============================================
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/users", userRoutes);
app.use("/api/partnerships", partnershipRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/ratings", ratingRoutes);

// ============================================
// 404 Handler
// ============================================
app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.method} ${req.path} not found`,
    availableEndpoints: [
      "/healthz",
      "/api/auth",
      "/api/projects",
      "/api/jobs",
      "/api/applications",
      "/api/users",
      "/api/partnerships",
      "/api/reviews",
      "/api/stats",
      "/api/ratings"
    ]
  });
});

// ============================================
// Global Error Handler
// ============================================
app.use((err, req, res, next) => {
  console.error("❌ Global Error:", err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: "Validation Error",
      message: err.message,
      details: err.errors
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    return res.status(400).json({
      error: "Duplicate Entry",
      message: "A record with this data already exists"
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: "Invalid Token",
      message: "Authentication failed"
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: "Token Expired",
      message: "Please login again"
    });
  }

  // Default error
  res.status(err.status || 500).json({
    error: "Internal Server Error",
    message: process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack })
  });
});

// ============================================
// Start Server (Local Development Only)
// ============================================
const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 Local: http://localhost:${PORT}`);
    console.log('='.repeat(50));
  });
}

export default app;