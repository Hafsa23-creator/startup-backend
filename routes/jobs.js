
import express from "express";
import Job from "../models/Job.js";

const router = express.Router();


router.get("/", async (req, res) => {
  try {
    const jobs = await Job.find().populate("createdBy", "fullname email role");
    res.json(jobs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "خطأ في السيرفر" });
  }
});


router.post("/", async (req, res) => {
  const { title, company, location, description, type, createdBy } = req.body;

 
  if (!title || !company || !location || !createdBy) {
    return res.status(400).json({ msg: "يرجى ملء الحقول المطلوبة" });
  }

  try {
    const newJob = new Job({
      title,
      company,
      location,
      description: description || "",
      type: type || "job",  
      createdBy,
    });

    await newJob.save();

    const populatedJob = await Job.findById(newJob._id).populate("createdBy", "fullname email role");
    res.status(201).json(populatedJob);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "خطأ في السيرفر" });
  }
});
export default router;
