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


app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // 1. ابحث على المستخدم في قاعدة البيانات
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ msg: 'المستخدم غير موجود' });
    }
    
    // 2. تحقق من كلمة المرور
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(400).json({ msg: 'كلمة المرور خاطئة' });
    }
    
    // 3. أنشئ token
    const token = jwt.sign(
      { userId: user._id }, 
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // 4. أرجع بيانات المستخدم
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      },
      token
    });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'خطأ في السيرفر' });
  }
});

export default router;