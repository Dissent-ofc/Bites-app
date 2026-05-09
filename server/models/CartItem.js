import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    qty: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 }
  },
  { timestamps: true }
);

cartItemSchema.index({ userId: 1, name: 1 }, { unique: true });


export const CartItem = mongoose.model("CartItem", cartItemSchema);
