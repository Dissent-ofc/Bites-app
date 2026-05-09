import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "bites-dev-secret";

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: payload.id,
      email: payload.email,
    };
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
