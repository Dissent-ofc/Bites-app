import express from "express";
import { CartItem } from "../models/CartItem.js";

const router = express.Router();

function parseNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : Number.NaN;
}

function getUserFilter(req, extra = {}) {
  return {
    userId: req.user.id,
    ...extra,
  };
}

async function fetchUserCartItems(req) {
  return CartItem.find(getUserFilter(req)).sort({ createdAt: 1 }).lean();
}

async function addCartItemHandler(req, res) {
  const rawName = req.body?.name;
  const name = typeof rawName === "string" ? rawName.trim() : "";
  const qty = parseNumber(req.body?.qty ?? 1);
  const price = parseNumber(req.body?.price);

  if (!name) {
    return res.status(400).json({ message: "name is required" });
  }

  if (!Number.isFinite(qty) || qty < 1) {
    return res.status(400).json({ message: "qty must be a positive number" });
  }

  if (!Number.isFinite(price) || price < 0) {
    return res.status(400).json({ message: "price must be a valid number" });
  }

  await CartItem.findOneAndUpdate(
    getUserFilter(req, { name }),
    {
      $inc: { qty },
      $set: { price, userId: req.user.id, name },
    },
    { upsert: true, new: true, runValidators: true }
  );

  const cartItems = await fetchUserCartItems(req);
  return res.status(201).json({ cartItems });
}

router.get("/", async (req, res) => {
  try {
    const cartItems = await fetchUserCartItems(req);
    res.json({ cartItems });
  } catch (error) {
    console.error("Failed to fetch cart items", error);
    res.status(500).json({ message: "Failed to fetch cart items" });
  }
});

router.post("/", async (req, res) => {
  try {
    return await addCartItemHandler(req, res);
  } catch (error) {
    console.error("Failed to add cart item", error);
    return res.status(500).json({ message: "Failed to add cart item" });
  }
});

router.post("/add", async (req, res) => {
  try {
    return await addCartItemHandler(req, res);
  } catch (error) {
    console.error("Failed to add cart item", error);
    return res.status(500).json({ message: "Failed to add cart item" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const delta = parseNumber(req.body?.delta);

    if (!Number.isFinite(delta) || delta === 0) {
      return res.status(400).json({ message: "delta must be a valid number" });
    }

    const item = await CartItem.findOneAndUpdate(
      getUserFilter(req, { _id: req.params.id }),
      { $inc: { qty: delta } },
      { new: true, runValidators: true }
    ).lean();

    if (!item) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    if (item.qty <= 0) {
      await CartItem.deleteOne(getUserFilter(req, { _id: req.params.id }));
    }

    const cartItems = await fetchUserCartItems(req);
    return res.json({ cartItems });
  } catch (error) {
    console.error("Failed to update cart item", error);
    return res.status(500).json({ message: "Failed to update cart item" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const deleted = await CartItem.findOneAndDelete(getUserFilter(req, { _id: req.params.id }));

    if (!deleted) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    const cartItems = await fetchUserCartItems(req);
    return res.json({ cartItems });
  } catch (error) {
    console.error("Failed to remove cart item", error);
    return res.status(500).json({ message: "Failed to remove cart item" });
  }
});

export default router;
