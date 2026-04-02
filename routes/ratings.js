import express from "express";
import Rating from "../models/Rating.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    console.log("BODY RECEIVED:", req.body); // ⚠️ مهم لتتأكدي
    const newRating = new Rating(req.body);
    await newRating.save();
    res.status(201).json({ msg: "تم حفظ التقييم ✅" });
  } catch (error) {
    console.error("ERROR SAVING RATING:", error);
    res.status(500).json({ msg: "خطأ في الحفظ ❌" });
  }
});

export default router;