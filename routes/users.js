import express from "express";
import User from "../models/User.js";
import Project from "../models/Project.js";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

const router = express.Router();

// ====================== Cloudinary Configuration ======================
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ====================== Multer Configuration (Memory Storage) ======================
const upload = multer({
  storage: multer.memoryStorage(),   // مهم جداً على Vercel
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("الملف يجب أن يكون PDF فقط!"));
    }
  },
});

// ====================== Upload Function to Cloudinary ======================
const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    console.log("بدء رفع الملف إلى Cloudinary... حجم الملف:", buffer.length);

    const cldUploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "startdz_cvs",
        resource_type: "raw",        // مهم جداً للـ PDF
        public_id: `cv-${Date.now()}-${Math.round(Math.random() * 1e9)}`,
        overwrite: true,
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary Upload Error:", error);
          reject(error);
        } else {
          console.log("✅ Cloudinary Success! URL:", result.secure_url);
          resolve(result);
        }
      }
    );

    streamifier.createReadStream(buffer).pipe(cldUploadStream);
  });
};

// ====================== Routes ======================

// رفع الـ CV
router.post("/upload-cv/:id", upload.single("cv"), async (req, res) => {
  console.log("=== طلب رفع CV وصل ===");
  console.log("User ID:", req.params.id);

  try {
    if (!req.file) {
      return res.status(400).json({ msg: "لم يتم رفع أي ملف أو الملف غير PDF" });
    }

    // رفع إلى Cloudinary
    const result = await uploadToCloudinary(req.file.buffer);

    const cvUrl = result.secure_url;   // رابط دائم وآمن

    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { cvUrl },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ msg: "المستخدم غير موجود" });
    }

    res.json({ 
      msg: "تم رفع السيرة الذاتية بنجاح!", 
      cvUrl 
    });

  } catch (err) {
    console.error("❌ خطأ في رفع CV:", err);
    res.status(500).json({ 
      msg: "خطأ في رفع الملف", 
      error: err.message 
    });
  }
});

// تحديث الوصف الشخصي
router.patch("/:id", async (req, res) => {
  try {
    const { profileDescription } = req.body;
    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { profileDescription },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ msg: "المستخدم غير موجود" });
    }

    res.json({ msg: "تم حفظ الوصف بنجاح!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "خطأ في السيرفر" });
  }
});

// جلب الطلاب
router.get("/students", async (req, res) => {
  try {
    const students = await User.find({ role: "student" })
      .select("fullname email region specialty university cvUrl profileDescription")
      .sort({ createdAt: -1 })
      .lean();

    const studentsWithCount = await Promise.all(
      students.map(async (student) => {
        const projectsCount = await Project.countDocuments({ owner: student._id });
        return { ...student, projectsCount };
      })
    );

    res.json(studentsWithCount);
  } catch (err) {
    console.error("خطأ جلب الطلاب:", err);
    res.status(500).json({ msg: "خطأ في السيرفر" });
  }
});

// جلب الخبراء
router.get("/experts", async (req, res) => {
  try {
    const experts = await User.find({ role: "expert" })
      .select("fullname expertise experienceYears preferredSectors _id");

    res.json(experts);
  } catch (err) {
    console.error("خطأ جلب الخبراء:", err);
    res.status(500).json({ msg: "خطأ في السيرفر" });
  }
});

// جلب مستخدم واحد
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      "fullname email role expertise experienceYears preferredSectors companyName specialty"
    );

    if (!user) {
      return res.status(404).json({ msg: "المستخدم غير موجود" });
    }

    res.json(user);
  } catch (err) {
    console.error("خطأ في جلب المستخدم:", err);
    res.status(500).json({ msg: "خطأ في السيرفر" });
  }
});

export default router;