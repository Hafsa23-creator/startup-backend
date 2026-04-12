// api/index.js
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

// Load environment variables
dotenv.config();

// Configure DNS
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const app = express();

// ============================================
// CORS Configuration
// ============================================
app.use((req, res, next) => {
  const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://startup-dz.netlify.app",
    "https://prismatic-beignet-541326.netlify.app"
  ];

  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }

  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-CSRF-Token");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  next();
});

// ============================================
// Middleware
// ============================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

// ============================================
// MongoDB Connection
// ============================================
let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    console.log("📌 Using existing MongoDB connection");
    return;
  }

  try {
    if (!process.env.MONGO_URI) {
      throw new Error("❌ MONGO_URI is not defined in environment variables!");
    }

    const db = await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    isConnected = db.connections[0].readyState === 1;
    
    console.log("✅ MongoDB Connected Successfully");
    console.log(`📊 Database: ${db.connections[0].name}`);
    
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err.message);
    console.warn("⚠️ Server running WITHOUT database connection");
    
    // Retry connection after 5 seconds
    setTimeout(connectDB, 5000);
  }
};

// MongoDB events
mongoose.connection.on('connected', () => {
  console.log('🔗 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
  isConnected = false;
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ Mongoose disconnected from MongoDB');
  isConnected = false;
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('👋 MongoDB connection closed due to app termination');
  process.exit(0);
});

// Connect to DB on every request
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// ============================================
// Routes
// ============================================

// Health Check
app.get("/", (req, res) => {
  res.json({ 
    status: "OK",
    message: "API is running",
    timestamp: new Date().toISOString(),
    database: isConnected ? "Connected" : "Disconnected"
  });
});

app.get("/healthz", (req, res) => {
  res.status(200).json({ 
    status: "healthy",
    database: isConnected ? "connected" : "disconnected"
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/users", userRoutes);
app.use("/api/partnerships", partnershipRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/ratings", ratingRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ 
    msg: "Route not found",
    path: req.path 
  });
});

// ============================================
// Global Error Handler
// ============================================
app.use((err, req, res, next) => {
  console.error("❌ Global Error:", err);
  
  res.status(err.status || 500).json({
    msg: err.message || "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? {
      message: err.message,
      stack: err.stack
    } : "Something went wrong"
  });
});

// ============================================
// Start Server
// ============================================
const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 Local: http://localhost:${PORT}`);
    console.log('='.repeat(50));
  });
}

export default app;