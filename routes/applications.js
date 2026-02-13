import express from "express";
import Application from "../models/Application.js";
import Job from "../models/Job.js"; 

const router = express.Router();


router.get("/student/:id", async (req, res) => {
  try {
    const apps = await Application.find({ studentId: req.params.id })
      .populate("jobId", "title company")
      .sort({ createdAt: -1 });
    res.json(apps);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "خطأ في السيرفر" });
  }
});


router.get("/partner/:id", async (req, res) => {
  try {
    const apps = await Application.find({ partnerId: req.params.id })
      .populate("jobId", "title company")
      .populate("studentId", "fullname email")
      .sort({ createdAt: -1 });

    res.json(apps);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "خطأ في السيرفر" });
  }
});


router.post("/", async (req, res) => {
  const { jobId, studentId, message } = req.body;

  if (!jobId || !studentId) {
    return res.status(400).json({ msg: "بيانات ناقصة" });
  }

  try {
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ msg: "العرض غير موجود" });
    }

    const newApp = new Application({
      jobId,
      studentId,
      message,
      status: "pending",
      partnerId: job.createdBy, 
    });

    await newApp.save();

    const populated = await Application.findById(newApp._id)
      .populate("jobId", "title company")
      .populate("studentId", "fullname email")
      .populate("partnerId", "fullname");

    res.status(201).json(populated);
  } catch (err) {
    console.error("خطأ في إنشاء طلب توظيف:", err);
    res.status(500).json({ msg: "خطأ في السيرفر" });
  }
});


router.patch("/:id", async (req, res) => {
  const { status } = req.body;

  if (!["accepted", "rejected"].includes(status)) {
    return res.status(400).json({ msg: "حالة غير صالحة" });
  }

  try {
    const updated = await Application.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    )
      .populate("jobId", "title company")
      .populate("studentId", "fullname email");

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "خطأ في السيرفر" });
  }
});

export default router;