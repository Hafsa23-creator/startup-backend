// models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  fullname: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["student", "partner", "expert"], default: "student" },

  // بيانات الطلاب
  projectName: { type: String, default: "" },
  projectType: { type: String, default: "" },
  projectDescription: { type: String, default: "" },
  fundingNeeds: { type: String, default: "" },
  university: { type: String, default: "" },
  region: { type: String, default: "" },
  specialty: { type: String, default: "" },
  cvUrl: { type: String, default: "" }, // رابط الـ CV
  profileDescription: { type: String, default: "" }, // وصف احترافي

  // بيانات الشركاء
  companyName: { type: String, default: "" },
  interestedSectors: { type: [String], default: [] },
  interestedRegions: { type: [String], default: [] },

  // بيانات الخبير الاقتصادي (جديد)
  expertise: { type: String, default: "" }, // مجال الخبرة
  experienceYears: { type: String, default: "" }, // عدد سنوات الخبرة
  preferredSectors: { type: [String], default: [] }, // القطاعات المفضلة
}, { timestamps: true });

export default mongoose.model("User", userSchema);