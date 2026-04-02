import mongoose from "mongoose";

const RatingSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  rating: { type: Number, required: true },
  liked: { type: Boolean, default: false },
  comment: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Rating", RatingSchema);