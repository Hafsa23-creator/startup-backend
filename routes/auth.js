import express from "express";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = express.Router();


router.post("/register", async (req, res) => {
  try {
    const {
      fullname,
      email,
      password,
      role,
      projectName,
      projectType,
      projectDescription,
      fundingNeeds,
      university,
      region,
      specialty,
      companyName,
      interestedSectors,
      interestedRegions,
      expertise,
      experienceYears,
      preferredSectors,
    } = req.body;
  
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ msg: "الإيميل مستعمل من قبل" });
    }

    
    if (!password || password.length < 6) {
      return res.status(400).json({ msg: "كلمة المرور قصيرة جدًا (6 أحرف على الأقل)" });
    }
    const hashed = await bcrypt.hash(password, 10);

    
    const userData = {
      fullname: fullname || "غير محدد",
      email,
      password: hashed, 
      role: role || "student",
    };

    if (role === "student") {
      userData.projectName = projectName || "";
      userData.projectType = projectType || "";
      userData.projectDescription = projectDescription || "";
      userData.fundingNeeds = fundingNeeds || "";
      userData.university = university || "";
      userData.region = region || "";
      userData.specialty = specialty || "";
    }

    if (role === "partner") {
      userData.companyName = companyName || "";
      userData.interestedSectors = Array.isArray(interestedSectors) ? interestedSectors : [];
      userData.interestedRegions = Array.isArray(interestedRegions) ? interestedRegions : [];
    }

    if (role === "expert") {
      userData.expertise = expertise || "";
      userData.experienceYears = experienceYears || "";
      userData.preferredSectors = Array.isArray(preferredSectors) ? preferredSectors : [];
    }

    
    const user = new User(userData);
    await user.save();

    
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" }
    );

    
    res.status(201).json({
      token,
      user: {
        id: user._id,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
        expertise: user.expertise || "",
        experienceYears: user.experienceYears || "",
        preferredSectors: user.preferredSectors || [],
       
      },
    });
  } catch (err) {
    console.error("خطأ في التسجيل:", err);
    res.status(500).json({ msg: "خطأ في السيرفر" });
  }
});


router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ msg: "الإيميل وكلمة المرور مطلوبين" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: "الإيميل غير موجود" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "كلمة المرور خاطئة" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
        expertise: user.expertise || "",
        experienceYears: user.experienceYears || "",
        preferredSectors: user.preferredSectors || [],
      },
    });

  } catch (err) {
    console.error("خطأ في الدخول:", err);
    res.status(500).json({ msg: "خطأ في السيرفر" });
  }
});

export default router;