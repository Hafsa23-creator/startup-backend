// routes/reviews.js
import express from "express";
import Review from "../models/Review.js";
import mongoose from "mongoose";

const router = express.Router();

// الشريك يرسل طلب معاينة
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

    // نرجع البيانات مملوءة
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

// جلب التقارير المكتملة للشريك
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

// جلب الطلبات الواردة للخبير (pending)
// جلب الطلبات الواردة للخبير (pending)
router.get("/expert/pending", async (req, res) => {
  try {
    const expertIdStr = req.query.expertId;

    if (!expertIdStr) {
      return res.status(400).json({ msg: "expertId مطلوب" });
    }

    let expertId;
    try {
      expertId = new mongoose.Types.ObjectId(expertIdStr);
    } catch (err) {
      console.error("expertId غير صالح:", err);
      return res.status(400).json({ msg: "معرف الخبير غير صالح" });
    }

    const requests = await Review.find({
      expertId: expertId,
      status: "pending"
    })
      .populate({
        path: "projectId",
        select: "name description fundingNeeds sector region",
        strictPopulate: false // ← مهم: يتجاهل إذا الحقل مش موجود
      })
      .populate({
        path: "partnerId",
        select: "fullname companyName",
        strictPopulate: false
      })
      .populate({
        path: "studentId",
        select: "fullname email",
        strictPopulate: false
      })
      .sort({ createdAt: -1 })
      .lean(); // lean يخفف الأخطاء ويرجع plain objects

    res.json(requests || []);
  } catch (err) {
    console.error("خطأ كبير في /expert/pending:", {
      message: err.message,
      stack: err.stack,
      expertId: req.query.expertId
    });
    res.status(500).json({ 
      msg: "خطأ داخلي في السيرفر", 
      error: err.message 
    });
  }
});
// جلب المعاينات المكتملة للخبير
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

// تحديث التقرير والقرار (مع populate كامل في الرد)
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