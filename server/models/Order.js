import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    userEmail: { type: String, required: true, trim: true, lowercase: true, index: true },
    orderCode: { type: String, required: true, trim: true },
    restaurant: { type: String, required: true, trim: true },
    items: { type: String, required: true },
    total: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, required: true, trim: true, default: "Cash on Delivery" },
    deliveryAddress: { type: String, trim: true, default: "" },
    status: { type: String, required: true, trim: true },
    time: { type: String, required: true },
    img: { type: String, required: true }
  },
  { timestamps: true }
);

orderSchema.index({ userEmail: 1, createdAt: -1 });
// Ensure orderCode is unique per user email so orders can be distinguished by user + code
orderSchema.index({ userEmail: 1, orderCode: 1 }, { unique: true });


export const Order = mongoose.model("Order", orderSchema);
