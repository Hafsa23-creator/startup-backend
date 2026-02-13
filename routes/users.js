import express from "express";
import User from "../models/User.js";
import Project from "../models/Project.js";
import multer from "multer";

const router = express.Router();


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); 
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, "cv-" + uniqueSuffix + ".pdf");
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("الملف يجب أن يكون PDF فقط!"));
    }
  },
});


router.post("/upload-cv/:id", upload.single("cv"), async (req, res) => {
  console.log("=== بداية رفع CV ===");
  console.log("ID:", req.params.id);
  console.log("File:", req.file);
  console.log("Body:", req.body);

  try {
    if (!req.file) {
      return res.status(400).json({ msg: "لا ملف مرفوع أو غير PDF" });
    }

    const cvUrl = `/uploads/${req.file.filename}`;
    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { cvUrl },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ msg: "المستخدم غير موجود" });
    }

    res.json({ msg: "تم رفع السيرة الذاتية بنجاح!", cvUrl });
  } catch (err) {
    console.error("خطأ رفع CV:", err);
    res.status(500).json({ msg: "خطأ في السيرفر" });
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