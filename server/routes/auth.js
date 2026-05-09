import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { User } from "../models/User.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "bites-dev-secret";

async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

function toPublicUser(userDoc) {
  return {
    id: userDoc._id,
    name: userDoc.name,
    email: userDoc.email,
    phone: userDoc.phone || "",
  };
}

function signUserToken(userDoc) {
  return jwt.sign(
    {
      id: String(userDoc._id),
      email: userDoc.email,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name?.trim() || !email?.trim() || !password?.trim()) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    if (password.trim().length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({ message: "User already exists. Please use login." });
    }

    const passwordHash = await hashPassword(password);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone?.trim() || "",
      passwordHash,
    });

    const token = signUserToken(user);

    return res.status(201).json({ user: toPublicUser(user), token });
  } catch (error) {
    console.error("Failed to sign up", error);
    return res.status(500).json({ message: "Failed to sign up" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password?.trim()) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ message: "User not found. Please sign up first." });
    }

    let match = false;

    // If the stored hash looks like a bcrypt hash, use bcrypt.compare.
    if (typeof user.passwordHash === "string" && user.passwordHash.startsWith("$2")) {
      match = await bcrypt.compare(password, user.passwordHash);
    } else if (typeof user.passwordHash === "string" && /^[a-f0-9]{64}$/i.test(user.passwordHash)) {
      // Common legacy: SHA-256 hex string. Compare and upgrade if it matches.
      const sha = crypto.createHash("sha256").update(password, "utf8").digest("hex");
      match = sha === user.passwordHash.toLowerCase();
      if (match) {
        try {
          const newHash = await hashPassword(password);
          await User.updateOne({ _id: user._id }, { passwordHash: newHash });
        } catch (err) {
          console.warn("Failed to upgrade legacy SHA password hash for user", user.email, err);
        }
      }
    } else {
      // Legacy fallback: direct equality check (possible plaintext). If it matches, upgrade to bcrypt.
      match = password === user.passwordHash;
      if (match) {
        try {
          const newHash = await hashPassword(password);
          await User.updateOne({ _id: user._id }, { passwordHash: newHash });
        } catch (err) {
          console.warn("Failed to upgrade legacy password hash for user", user.email, err);
        }
      }
    }

    if (!match) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = signUserToken(user);

    return res.json({ user: toPublicUser(user), token });
  } catch (error) {
    console.error("Failed to login", error);
    return res.status(500).json({ message: "Failed to login" });
  }
});

export default router;
