
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  fullname: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["student", "partner", "expert"], default: "student" },

  
  projectName: { type: String, default: "" },
  projectType: { type: String, default: "" },
  projectDescription: { type: String, default: "" },
  fundingNeeds: { type: String, default: "" },
  university: { type: String, default: "" },
  region: { type: String, default: "" },
  specialty: { type: String, default: "" },
  cvUrl: { type: String, default: "" }, 
  profileDescription: { type: String, default: "" }, 

  
  companyName: { type: String, default: "" },
  interestedSectors: { type: [String], default: [] },
  interestedRegions: { type: [String], default: [] },

  
  expertise: { type: String, default: "" }, 
  experienceYears: { type: String, default: "" }, 
  preferredSectors: { type: [String], default: [] }, 
}, { timestamps: true });

export default mongoose.model("User", userSchema);