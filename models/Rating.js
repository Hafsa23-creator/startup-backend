import mongoose from "mongoose";

const ratingSchema = new mongoose.Schema({
  userId: { type: String, required: true },   // أو ObjectId لو ربطتي بالـ User
  rating: { type: Number, required: true },
  liked: { type: Boolean, default: false },
  comment: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Rating", ratingSchema);