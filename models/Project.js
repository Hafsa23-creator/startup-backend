// models/Project.js
import mongoose from "mongoose";

const projectSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // صاحب المشروع
  name: { type: String, required: true },
  sector: { type: String, required: true },
  region: { type: String, required: true },
  description: { type: String, default: "" },
  fundingNeeds: { type: String, default: "" },
  partnersContacted: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  status: { type: String, enum: ["published", "draft"], default: "published" }
}, { timestamps: true });

export default mongoose.model("Project", projectSchema);
