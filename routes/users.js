import express from "express";
import User from "../models/User.js";
import Project from "../models/Project.js";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";
const router = express.Router();

// إعداد Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("الملف يجب أن يكون PDF فقط!"));
    }
  },
});

const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "startdz_cvs",
        resource_type: "raw",
        public_id: `cv-${Date.now()}`,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

router.post("/upload-cv/:id", upload.single("cv"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: "لا ملف مرفوع أو غير PDF" });
    }

    const result = await uploadToCloudinary(req.file.buffer);
    const cvUrl = result.secure_url;

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
    console.error("خطأ رفع CV:", err);
    res.status(500).json({ msg: "خطأ في رفع الملف" });
  }
});


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