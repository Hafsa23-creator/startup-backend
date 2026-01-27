import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  partnerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // ← السطر الجديد اللي كان ناقص!!
  message: { type: String },
  status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
}, { timestamps: true });

export default mongoose.model("Application", applicationSchema);