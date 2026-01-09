// src/controllers/authController.ts
import { PrismaClient, User } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import type { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import { SignOptions } from "jsonwebtoken";

import { signAccessToken, signRefreshToken, verifyToken } from "../../lib/jwt";
const prisma = new PrismaClient();

const oAuth2Client = new OAuth2Client(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  "postmessage",
);
// Read secrets from env
const ACCESS_SECRET = process.env.JWT_ACCESS_TOKEN_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_TOKEN_SECRET!;
const ACCESS_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN ?? "15m";
const REFRESH_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN ?? "1d";
const REFRESH_COOKIE_NAME = "refreshToken"; // cookie name for refresh token

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}
// SIGNUP
const signup = async (req: Request, res: Response) => {
  try {
    const { email, name, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });

    // check if user exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: "Email already in use" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name: name ?? null,
        password: hashed,
      },
    });

    // create tokens
    const accessToken = signAccessToken(
      { userId: user.id },
      ACCESS_SECRET,
      ACCESS_EXPIRES_IN as SignOptions["expiresIn"],
    );
    const refreshToken = signRefreshToken(
      { userId: user.id },
      REFRESH_SECRET,
      REFRESH_EXPIRES_IN as SignOptions["expiresIn"],
    );

    // store hashed refresh token with expiry
    const ttlSeconds = parseDurationToSeconds(REFRESH_EXPIRES_IN);
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    await prisma.refreshToken.create({
      data: {
        tokenHash: hashToken(refreshToken),
        userId: user.id,
        expiresAt,
      },
    });

    return res.status(201).json({ token: accessToken, user: sanitizeUser(user) });
  } catch (err) {
    console.error("signup error", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
const googleSignup = async (req: Request, res: Response) => {
  try {
    const { tokens } = await oAuth2Client.getToken(req.body.code);

    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    const googleUser = await userRes.json();

    if (!googleUser?.email) {
      return res.status(400).json({ error: "Unable to fetch Google user" });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: googleUser.email },
    });

    if (existingUser) {
      return res.status(409).json({
        error: "User already exists. Please log in instead.",
      });
    }

    // ✅ CREATE NEW USER
    const user = await prisma.user.create({
      data: {
        email: googleUser.email,
        name: googleUser.name,
        picture: googleUser.picture,
        googleId: googleUser.id,
        provider: "GOOGLE",
      },
    });

    // 🔐 ISSUE YOUR OWN JWT (IMPORTANT)
    const accessToken = signAccessToken(
      { userId: user.id },
      ACCESS_SECRET,
      ACCESS_EXPIRES_IN as SignOptions["expiresIn"],
    );
    const refreshToken = signRefreshToken(
      { userId: user.id },
      REFRESH_SECRET,
      REFRESH_EXPIRES_IN as SignOptions["expiresIn"],
    );

    // store hashed refresh token with expiry
    const ttlSeconds = parseDurationToSeconds(REFRESH_EXPIRES_IN);
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    await prisma.refreshToken.create({
      data: {
        tokenHash: hashToken(refreshToken),
        userId: user.id,
        expiresAt,
      },
    });

    return res.status(201).json({ token: accessToken, user: sanitizeUser(user) });
  } catch (err) {
    console.error("signup error", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// LOGIN
const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { projects: true, memberships: true },
    });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    if (user.provider !== "LOCAL") {
      return res.status(400).json({
        error: "Use Google login",
      });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Invalid credentials" });

    // generate tokens
    const accessToken = signAccessToken(
      { userId: user.id },
      ACCESS_SECRET,
      ACCESS_EXPIRES_IN as SignOptions["expiresIn"],
    );
    const refreshToken = signRefreshToken(
      { userId: user.id },
      REFRESH_SECRET,
      REFRESH_EXPIRES_IN as SignOptions["expiresIn"],
    );

    // save hashed refresh token
    const ttlSeconds = parseDurationToSeconds(REFRESH_EXPIRES_IN);
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    await prisma.refreshToken.create({
      data: {
        tokenHash: hashToken(refreshToken),
        userId: user.id,
        expiresAt,
      },
    });

    return res.status(200).json({ token: accessToken, refreshToken, user: sanitizeUser(user) });
  } catch (err) {
    console.error("login error", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const googleLogin = async (req: Request, res: Response) => {
  try {
    const { tokens } = await oAuth2Client.getToken(req.body.code);

    // Fetch Google user profile
    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    const googleUser = await userRes.json();

    if (!googleUser?.email) {
      return res.status(400).json({ error: "Unable to fetch Google user" });
    }

    const user = await prisma.user.findUnique({ where: { email: googleUser.email } });

    if (!user || user.provider !== "GOOGLE") {
      return res.status(403).json({
        error: "User not registered with Google",
      });
    }
    const accessToken = signAccessToken(
      { userId: user.id },
      ACCESS_SECRET,
      ACCESS_EXPIRES_IN as SignOptions["expiresIn"],
    );
    const refreshToken = signRefreshToken(
      { userId: user.id },
      REFRESH_SECRET,
      REFRESH_EXPIRES_IN as SignOptions["expiresIn"],
    );

    // save hashed refresh token
    const ttlSeconds = parseDurationToSeconds(REFRESH_EXPIRES_IN);
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    await prisma.refreshToken.create({
      data: {
        tokenHash: hashToken(refreshToken),
        userId: user.id,
        expiresAt,
      },
    });

    return res.status(200).json({ token: accessToken, refreshToken, user: sanitizeUser(user) });
  } catch (err) {
    console.error("login error", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// REFRESH
const refresh = async (req: Request, res: Response) => {
  try {
    const rt = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;

    if (!rt) return res.status(401).json({ error: "No refresh token" });

    // verify signature
    let payload: { userId: number | undefined };
    try {
      payload = verifyToken(rt, REFRESH_SECRET);
    } catch {
      return res.status(401).json({ error: "Invalid refresh token. Login again" });
    }

    // check DB for hashed token
    const tokenHash = hashToken(rt);
    const stored = await prisma.refreshToken.findFirst({
      where: { tokenHash, userId: payload.userId },
      include: { user: true },
    });

    if (!stored) return res.status(401).json({ error: "Refresh token revoked. Login again" });

    // check expiry
    if (stored.expiresAt < new Date()) {
      // remove expired token
      await prisma.refreshToken.delete({ where: { id: stored.id } });
      return res.status(401).json({ error: "Refresh token expired. Login again" });
    }

    // At this point the refresh token is valid and NOT expired.
    // Issue a new access token (do NOT delete the refresh token).
    const user = stored.user;
    const accessToken = signAccessToken(
      { userId: user.id },
      ACCESS_SECRET,
      ACCESS_EXPIRES_IN as SignOptions["expiresIn"],
    );

    return res.status(200).json({ token: accessToken, user: sanitizeUser(user) });
  } catch (err) {
    console.error("refresh error", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// LOGOUT
const logout = async (req: Request, res: Response) => {
  try {
    const rt = req.body.refreshToken as string | undefined;
    if (rt) {
      const tokenHash = hashToken(rt);
      await prisma.refreshToken.deleteMany({ where: { tokenHash } });
    }
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("logout error", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
export { googleLogin, googleSignup, login, logout, refresh, signup };

/* -------------------- helpers -------------------- */

function sanitizeUser(user: User) {
  const { password, ...rest } = user;
  return rest;
}

function parseDurationToSeconds(input: string) {
  // support formats like "1h", "7d", or plain seconds ("3600")
  if (/^\d+$/.test(input)) return parseInt(input, 10);
  // try ms package-ish parsing: hours/days
  // simple parser:
  const m = input.match(/^(\d+)([smhd])$/);
  if (!m) {
    // fallback: try Date parsing (not ideal)
    return 60 * 60; // default 1 hour
  }
  const n = parseInt(m[1], 10);
  const unit = m[2];
  switch (unit) {
    case "s":
      return n;
    case "m":
      return n * 60;
    case "h":
      return n * 60 * 60;
    case "d":
      return n * 60 * 60 * 24;
    default:
      return 60 * 60;
  }
}
