import express from "express";
import Project from "../models/Project.js";

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

// CREATE project
router.post("/", async (req, res) => {
  const { name, sector, region, description, fundingNeeds, owner } = req.body;

  if (!name || !sector || !region || !owner) {
    return res.status(400).json({ msg: "يرجى ملء الحقول المطلوبة" });
  }

  try {
    const project = new Project({
      name,
      sector,
      region,
      description,
      fundingNeeds,
      owner,
    });

    await project.save();

    const populated = await Project.findById(project._id)
      .populate("owner", "fullname email role");

    res.status(201).json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "خطأ في السيرفر" });
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