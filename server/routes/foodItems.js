import express from "express";
import { FoodItem } from "../models/FoodItem.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { q, category } = req.query;
    const filter = {};

    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { cuisine: { $regex: q, $options: "i" } }
      ];
    }

    if (category && category !== "All") {
      filter.category = category;
    }

    const foodItems = await FoodItem.find(filter).sort({ rating: -1, name: 1 }).lean();
    res.json({ foodItems });
  } catch {
    res.status(500).json({ message: "Failed to fetch food items" });
  }
});

export default router;
