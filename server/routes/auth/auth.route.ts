// src/routes/authRoutes.ts
import express from "express";
import {
  signup,
  login,
  refresh,
  logout,
} from "../../controllers/auth/auth.controller";
import cookieParser from "cookie-parser";

const router = express.Router();
router.use(cookieParser());

// POST /api/auth/signup
router.post("/signup", signup);

// POST /api/auth/login
router.post("/login", login);

// POST /api/auth/refresh  (reads refresh token cookie)
router.post("/refresh", refresh);

// POST /api/auth/logout
router.post("/logout", logout);

export default router;
