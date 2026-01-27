// models/Job.js
import mongoose from "mongoose";

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  company: { type: String, required: true },
  location: { type: String, required: true },
  description: { type: String, default: "" },
  type: { type: String, default: "job" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // الجهة المنشئة (Partner)
}, { timestamps: true });

export default mongoose.model("Job", jobSchema);
