// src/middleware/authMiddleware.ts
import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../lib/jwt";

const ACCESS_SECRET = process.env.JWT_ACCESS_TOKEN_SECRET!;

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth)
    return res.status(401).json({ error: "Missing authorization header" });
  const parts = auth.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer")
    return res.status(401).json({ error: "Invalid auth header" });

  const token = parts[1];
  try {
    const payload = verifyToken(token, ACCESS_SECRET);
    console.log("payloadpayload", payload);

    // attach user id to req
    (req as any).user = payload;
    return next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
