import express from "express";
import Project from "../models/Project.js";
import { upload, uploadToCloudinary } from "../middleware/upload.js";
const router = express.Router();


router.get("/", async (req, res) => {
  try {
    const projects = await Project.find()
      .populate("owner", "fullname email role");
    res.json(projects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "خطأ في السيرفر" });
  }
});


router.get("/student/:id", async (req, res) => {
  try {
    const projects = await Project.find({ owner: req.params.id })
      .populate("owner", "fullname email role");
    res.json(projects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "خطأ في السيرفر" });
  }
});

// ======================
// CREATE مشروع + رفع فيديو
// ======================
router.post("/", upload.single("video"), async (req, res) => {
  const { name, sector, region, description, fundingNeeds, owner } = req.body;

  if (!name || !sector || !region || !owner) {
    return res.status(400).json({ msg: "يرجى ملء الحقول المطلوبة" });
  }

  let videoUrl = "";

  try {
    // إذا رفع الطالب فيديو
    if (req.file) {
      videoUrl = await uploadToCloudinary(req.file.path);
    }

    const project = new Project({
      name,
      sector,
      region,
      description: description || "",
      fundingNeeds: fundingNeeds || "",
      videoUrl,           // ← حفظ رابط الفيديو
      owner,
    });

    await project.save();

    const populated = await Project.findById(project._id)
      .populate("owner", "fullname email role");

    res.status(201).json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "خطأ في حفظ المشروع أو رفع الفيديو" });
  }
});

// ======================
// UPDATE تعديل المشروع (مع إمكانية تغيير الفيديو)
// ======================
router.put("/:id", upload.single("video"), async (req, res) => {
  const { name, sector, region, description, fundingNeeds } = req.body;
  const userId = req.query.userId;

  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ msg: "المشروع غير موجود" });
    }

    if (project.owner.toString() !== userId) {
      return res.status(403).json({ msg: "غير مسموح بالتعديل" });
    }

    let videoUrl = project.videoUrl; // يحتفظ بالفيديو القديم إذا ما رفع جديد

    // إذا رفع فيديو جديد
    if (req.file) {
      videoUrl = await uploadToCloudinary(req.file.path);
    }

    // تحديث الحقول
    project.name = name || project.name;
    project.sector = sector || project.sector;
    project.region = region || project.region;
    project.description = description !== undefined ? description : project.description;
    project.fundingNeeds = fundingNeeds !== undefined ? fundingNeeds : project.fundingNeeds;
    project.videoUrl = videoUrl;

    await project.save();

    const updated = await Project.findById(project._id)
      .populate("owner", "fullname email role");

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "خطأ في تعديل المشروع" });
  }
});
router.delete("/:id", async (req, res) => {
  const userId = req.query.userId;

  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ msg: "المشروع غير موجود" });
    }

    if (project.owner.toString() !== userId) {
      return res.status(403).json({ msg: "غير مسموح بالحذف" });
    }

    await project.deleteOne();
    res.json({ msg: "تم حذف المشروع" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "خطأ في السيرفر" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("owner", "fullname _id"); 

    if (!project) {
      return res.status(404).json({ msg: "المشروع غير موجود" });
    }

    res.json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "خطأ في السيرفر" });
  }
});

export default router;