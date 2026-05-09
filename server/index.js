import "dotenv/config";
import { pathToFileURL } from "node:url";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import express from "express";
import { connectDB } from "./config/db.js";
import { seedDatabase } from "./seed.js";
import foodItemsRoutes from "./routes/foodItems.js";
import cartRoutes from "./routes/cart.js";
import ordersRoutes from "./routes/orders.js";
import authRoutes from "./routes/auth.js";
import { authenticate } from "./middleware/auth.js";

const port = process.env.PORT || 5000;

export function createApp() {
  const app = express();

  app.use(helmet());

  // Strict CORS: allow origins via ALLOWED_ORIGINS env (comma-separated).
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:5173").split(",");
  app.use(
    cors({
      origin: (origin, callback) => {
        // allow non-browser requests like curl/postman (no origin)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true);
        return callback(new Error("CORS policy: origin not allowed"));
      },
    })
  );

  app.use(express.json());

  // Basic rate limiting
  app.use(
    rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 120, // limit each IP to 120 requests per windowMs
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/food-items", foodItemsRoutes);
  app.use("/api/cart", authenticate, cartRoutes);
  app.use("/api/orders", authenticate, ordersRoutes);
  app.use("/api/auth", authRoutes);

  return app;
}

export async function startServer() {
  try {
    const app = createApp();
    await connectDB();

    // In production, JWT_SECRET must be set.
    if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
      console.error("Missing JWT_SECRET environment variable in production. Aborting start.");
      process.exit(1);
    }

    if (process.env.SEED_ON_START !== "false") {
      await seedDatabase();
    }

    app.listen(port, () => {
      console.log(`API server running on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  startServer();
}
