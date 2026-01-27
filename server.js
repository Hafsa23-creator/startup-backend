// server.js
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import projectRoutes from "./routes/projects.js";
import jobRoutes from "./routes/jobs.js";
import applicationRoutes from "./routes/applications.js";
import userRoutes from "./routes/users.js";
import partnershipRoutes from "./routes/partnerships.js";
import reviewRoutes from "./routes/reviews.js";

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// جعل مجلد uploads متاح للتحميل (مهم للـ CV)
app.use("/uploads", express.static("uploads"));

// MongoDB Atlas connection (الرابط بدون +srv)
require("dotenv").config();
const mongoose = require("mongoose");

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected ✅"))
  .catch(err => console.log("MongoDB error:", err));



// Routes
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/users", userRoutes);
app.use("/api/partnerships", partnershipRoutes);
app.use("/api/reviews", reviewRoutes);


// Start server
const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));