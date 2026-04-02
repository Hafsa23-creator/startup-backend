import express from "express";
import User from "../models/User.js";     

const router = express.Router();

router.get("/visitors", async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: "student" });  

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const appVisitors = await User.countDocuments({
      lastLogin: { $gte: thirtyDaysAgo }    
    });

    res.json({
      totalUsers,
      appVisitors
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "خطأ في السيرفر" });
  }
});

export default router;