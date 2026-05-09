import express from "express";
import { Order } from "../models/Order.js";
import { CartItem } from "../models/CartItem.js";

const router = express.Router();

function formatOrderItems(cartItems) {
  return cartItems
    .map(item => `${item.name}${item.qty > 1 ? ` x${item.qty}` : ""}`)
    .join(", ");
}

function buildOrderCode() {
  return `#${Date.now().toString().slice(-4)}`;
}

function buildOrderIcon(orderCode) {
  const icons = ["🛵", "🚴", "🚚", "📦", "🍕", "🍔", "🌮", "🥗", "🍜", "🍱"];
  const numericSeed = Number(String(orderCode || "").replace(/\D/g, "")) || Date.now();
  return icons[numericSeed % icons.length];
}

router.get("/", async (req, res) => {
  try {
    const orders = await Order.find({ userEmail: req.user.email }).sort({ createdAt: -1 }).lean();
    res.json({ orders });
  } catch (error) {
    console.error("Failed to fetch orders", error);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
});

router.post("/checkout", async (req, res) => {
  try {
    const paymentMethod = (req.body?.paymentMethod || "Cash on Delivery").toString().trim() || "Cash on Delivery";
    const deliveryAddress = (req.body?.deliveryAddress || "").toString().trim();

    const orderCode = buildOrderCode();

    const cartItems = await CartItem.find({ userId: req.user.id }).sort({ createdAt: 1 });

    if (cartItems.length === 0) {
      return res.status(400).json({ message: "Your cart is empty" });
    }

    const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);
    const delivery = 40;
    const taxes = Math.round(subtotal * 0.05);
    const total = subtotal + delivery + taxes;

    // Ensure orderCode is unique per user (in case of collision, regenerate)
    let order;
    let attempts = 0;
    while (!order && attempts < 5) {
      try {
        order = await Order.create({
          userEmail: req.user.email,
          orderCode,
          restaurant: "Bites Kitchen",
          items: formatOrderItems(cartItems),
          total,
          paymentMethod,
          deliveryAddress,
          status: "On the way",
          time: "Just now",
          img: buildOrderIcon(orderCode)
        });
      } catch (err) {
        // If duplicate key on orderCode for this user, regenerate and retry
        if (err && err.code === 11000) {
          orderCode = buildOrderCode();
          attempts += 1;
          continue;
        }
        throw err;
      }
    }

    if (!order) {
      return res.status(500).json({ message: "Failed to create unique order code, try again" });
    }

    await CartItem.deleteMany({ userId: req.user.id });

    const orders = await Order.find({ userEmail: req.user.email }).sort({ createdAt: -1 });

    return res.status(201).json({ order, orders });
  } catch (error) {
    console.error("Failed to place order", error);
    return res.status(500).json({ message: "Failed to place order" });
  }
});

router.patch("/:id/cancel", async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, userEmail: req.user.email });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status === "Delivered" || order.status === "Cancelled") {
      return res.status(400).json({ message: `Cannot cancel a ${order.status.toLowerCase()} order` });
    }

    order.status = "Cancelled";
    await order.save();

    const orders = await Order.find({ userEmail: req.user.email }).sort({ createdAt: -1 });

    return res.json({ order, orders });
  } catch (error) {
    console.error("Failed to cancel order", error);
    return res.status(500).json({ message: "Failed to cancel order" });
  }
});

router.patch("/:id/deliver", async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, userEmail: req.user.email });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status === "Delivered") {
      return res.status(400).json({ message: "Order is already delivered" });
    }

    order.status = "Delivered";
    await order.save();

    const orders = await Order.find({ userEmail: req.user.email }).sort({ createdAt: -1 });

    return res.json({ order, orders });
  } catch (error) {
    console.error("Failed to update order", error);
    return res.status(500).json({ message: "Failed to update order" });
  }
});

export default router;
