import express from "express";
import Rating from "../models/Rating.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { userId, rating, liked, comment } = req.body;
    if (!userId || !rating) {
      return res.status(400).json({ msg: "الـ userId و rating مطلوبين" });
    }

    const newRating = new Rating({ userId, rating, liked, comment });
    const savedRating = await newRating.save();

    console.log("✅ تم تخزين التقييم:", savedRating); 
    res.status(201).json(savedRating);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "خطأ في السيرفر" });
  }
});

router.get("/", async (req, res) => {
  try {
    const ratings = await Rating.find().sort({ createdAt: -1 });
    res.json(ratings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "خطأ في السيرفر" });
  }
});

export default router;