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

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

app.use(express.json());
app.use("/uploads", express.static("uploads"));

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;

  const db = await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  isConnected = db.connections[0].readyState;
};

app.use(async (req, res, next) => {
  await connectDB();
  next();
});

app.get("/healthz", (req, res) => {
  res.status(200).send("OK");
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

app.use((err, req, res, next) => {
  res.status(500).json({ msg: "Internal Server Error", error: err.message });
});

export default app;