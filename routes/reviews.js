
import express from "express";
import Review from "../models/Review.js";
import mongoose from "mongoose";

const router = express.Router();


router.post("/", async (req, res) => {
  try {
    const { projectId, expertId, partnerId } = req.body;

    if (!projectId || !expertId || !partnerId) {
      return res.status(400).json({ msg: "جميع الحقول مطلوبة" });
    }

    if (!mongoose.Types.ObjectId.isValid(projectId) || !mongoose.Types.ObjectId.isValid(expertId) || !mongoose.Types.ObjectId.isValid(partnerId)) {
      return res.status(400).json({ msg: "معرف غير صالح" });
    }

    const newReview = new Review({
      projectId,
      expertId,
      partnerId,
      status: "pending",
      report: "",
    });

    await newReview.save();

    
    const populatedReview = await Review.findById(newReview._id)
      .populate("projectId", "name description fundingNeeds sector region")
      .populate("expertId", "fullname")
      .populate("partnerId", "fullname companyName");

    res.json({ msg: "تم إرسال طلب المعاينة بنجاح", review: populatedReview });
  } catch (err) {
    console.error("خطأ في إرسال الطلب:", err);
    res.status(500).json({ msg: "خطأ في السيرفر" });
  }
});


router.get("/partner", async (req, res) => {
  try {
    const partnerId = req.query.partnerId;

    if (!partnerId || !mongoose.Types.ObjectId.isValid(partnerId)) {
      return res.status(400).json({ msg: "partnerId مطلوب وصالح" });
    }

    const reviews = await Review.find({
      partnerId,
      status: { $in: ["approved", "rejected", "revision"] }
    })
      .populate("projectId", "name description fundingNeeds sector region")
      .populate("expertId", "fullname")
      .sort({ reviewedAt: -1 });

    res.json(reviews);
  } catch (err) {
    console.error("خطأ في جلب تقارير الشريك:", err);
    res.status(500).json({ msg: "خطأ في السيرفر" });
  }
});


router.get("/expert/pending", async (req, res) => {
  try {
    const expertId = req.query.expertId;

    if (!expertId || !mongoose.Types.ObjectId.isValid(expertId)) {
      return res.status(400).json({ msg: "expertId مطلوب وصالح" });
    }

    const requests = await Review.find({
      expertId,
      status: "pending"
    })
      .populate("projectId", "name description fundingNeeds sector region")
      .populate("partnerId", "fullname companyName")
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (err) {
    console.error("خطأ في جلب الطلبات الواردة للخبير:", err);
    res.status(500).json({ msg: "خطأ في السيرفر" });
  }
});


router.get("/expert/completed", async (req, res) => {
  try {
    const expertId = req.query.expertId;

    if (!expertId || !mongoose.Types.ObjectId.isValid(expertId)) {
      return res.status(400).json({ msg: "expertId مطلوب وصالح" });
    }

    const reviews = await Review.find({
      expertId,
      status: { $in: ["approved", "rejected", "revision"] }
    })
      .populate("projectId", "name description fundingNeeds sector region")
      .populate("partnerId", "fullname companyName")
      .sort({ reviewedAt: -1 });

    res.json(reviews);
  } catch (err) {
    console.error("خطأ في جلب المعاينات المكتملة:", err);
    res.status(500).json({ msg: "خطأ في السيرفر" });
  }
});


router.patch("/:id", async (req, res) => {
  try {
    const { report, status } = req.body;

    if (!report || !status) {
      return res.status(400).json({ msg: "التقرير والقرار مطلوبان" });
    }

    const validStatuses = ["approved", "rejected", "revision"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ msg: "القرار غير صالح" });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ msg: "معرف المعاينة غير صالح" });
    }

    const updatedReview = await Review.findByIdAndUpdate(
      req.params.id,
      { report, status, reviewedAt: new Date() },
      { new: true }
    )
      .populate("projectId", "name description fundingNeeds sector region")
      .populate("expertId", "fullname")
      .populate("partnerId", "fullname companyName");

    if (!updatedReview) {
      return res.status(404).json({ msg: "المعاينة غير موجودة" });
    }

    res.json({ msg: "تم حفظ التقرير والقرار بنجاح", review: updatedReview });
  } catch (err) {
    console.error("خطأ في تحديث التقرير:", err);
    res.status(500).json({ msg: "خطأ في السيرفر" });
  }
});

export default router;