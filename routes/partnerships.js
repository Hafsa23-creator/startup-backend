import express from "express";
import Partnership from "../models/Partnership.js";

const router = express.Router();

// جلب الطلبات المرسلة من الشريك (واحد برك، حذفنا التكرار)
router.get("/sent/:id", async (req, res) => {
  try {
    const sent = await Partnership.find({ partnerId: req.params.id })
      .populate("projectId", "name sector region")
      .populate("studentId", "fullname email")
      .sort({ createdAt: -1 });
    res.json(sent);
  } catch (err) {
    console.error("خطأ في جلب الطلبات المرسلة:", err);
    res.status(500).json({ msg: "خطأ في السيرفر" });
  }
});

// إنشاء طلب شراكة جديد (من الشريك)
router.post("/", async (req, res) => {
  const { projectId, partnerId, studentId, message } = req.body;

  if (!projectId || !partnerId || !studentId || !message) {
    return res.status(400).json({ msg: "يرجى ملء كل الحقول" });
  }

  try {
    const newPartnership = new Partnership({
      projectId,
      partnerId,
      studentId,
      message,
      status: "pending",
    });

    await newPartnership.save();

    const populated = await Partnership.findById(newPartnership._id)
      .populate("projectId", "name sector region")
      .populate("partnerId", "fullname email")
      .populate("studentId", "fullname");

    res.status(201).json(populated);
  } catch (err) {
    console.error("خطأ في إنشاء طلب الاهتمام:", err);
    res.status(500).json({ msg: "خطأ في السيرفر: " + err.message });
  }
});

// جلب طلبات الاهتمام الواردة للطالب
router.get("/student/:id", async (req, res) => {
  try {
    const partnerships = await Partnership.find({ studentId: req.params.id })
      .populate("projectId", "name sector region")
      .populate("partnerId", "fullname email")
      .sort({ createdAt: -1 });

    res.json(partnerships);
  } catch (err) {
    console.error("خطأ في جلب طلبات الاهتمام للطالب:", err);
    res.status(500).json({ msg: "خطأ في السيرفر" });
  }
});

// تحديث حالة الطلب (قبول أو رفض من الطالب)
router.patch("/:id", async (req, res) => {
  const { status } = req.body;

  if (!["accepted", "rejected"].includes(status)) {
    return res.status(400).json({ msg: "حالة غير صالحة" });
  }

  try {
    const updated = await Partnership.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    )
      .populate("projectId", "name sector region")
      .populate("partnerId", "fullname email")
      .populate("studentId", "fullname");

    if (!updated) {
      return res.status(404).json({ msg: "الطلب غير موجود" });
    }

    res.json(updated);
  } catch (err) {
    console.error("خطأ في تحديث حالة الطلب:", err);
    res.status(500).json({ msg: "خطأ في السيرفر" });
  }
});

export default router;