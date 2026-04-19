import multer from "multer";
import fs from "fs";
import cloudinary from "../config/cloudinary.js";   // المسار مهم: من middleware إلى config

// حفظ الفيديو مؤقتاً على السيرفر
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/videos/";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

// إعداد Multer (فقط فيديو + حد 200 ميجا)
const upload = multer({
  storage: storage,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200 ميجا
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("مسموح فقط برفع فيديوهات"), false);
    }
  }
});

// دالة رفع الفيديو إلى Cloudinary
const uploadToCloudinary = async (localFilePath) => {
  try {
    const result = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "video",        // مهم جداً للفيديو
      folder: "projects/videos",
    });

    // حذف الملف المؤقت بعد النجاح
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }

    return result.secure_url;   // هذا هو الرابط الذي نحفظه في قاعدة البيانات
  } catch (error) {
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    console.error("خطأ في رفع الفيديو إلى Cloudinary:", error);
    throw new Error("فشل في رفع الفيديو");
  }
};

export { upload, uploadToCloudinary };