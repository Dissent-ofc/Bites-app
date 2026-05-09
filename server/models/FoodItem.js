import mongoose from "mongoose";

const foodItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    cuisine: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    rating: { type: Number, required: true, min: 0, max: 5 },
    time: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    open: { type: Boolean, default: true },
    tag: { type: String, default: "" },
    img: { type: String, required: true },
    minOrder: { type: Number, required: true, min: 0 }
  },
  { timestamps: true }
);

foodItemSchema.index({ name: "text", cuisine: "text" });
foodItemSchema.index({ category: 1, rating: -1, name: 1 });

export const FoodItem = mongoose.model("FoodItem", foodItemSchema);
