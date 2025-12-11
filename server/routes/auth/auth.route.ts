// src/routes/authRoutes.ts
import cookieParser from "cookie-parser";
import express from "express";

import { login, logout, refresh, signup } from "../../controllers/auth/auth.controller";

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
