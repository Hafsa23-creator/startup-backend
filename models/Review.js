
import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
  expertId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  partnerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  report: { type: String, default: "" }, 
  status: { 
    type: String, 
    enum: ["pending", "approved", "rejected", "revision"], 
    default: "pending" 
  },
  comments: { type: String },
  reviewedAt: { type: Date },
}, { timestamps: true });

export default mongoose.model("Review", reviewSchema);