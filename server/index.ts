// src/index.ts
import express, { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import cors from "cors";

// import your routers / middleware (update paths as needed)
import AuthRouter from "./routes/auth/auth.route";
import UserRouter from "./routes/user.route";
import ProjectRouter from "./routes/project.route";
import EpicRouter from "./routes/epic.route";
import StoryRouter from "./routes/story.route";
import BugRouter from "./routes/bug.route";

import { requireAuth } from "./middleware/authMiddleware";

dotenv.config();

const app = express();
const prisma = new PrismaClient();

const PORT = Number(process.env.PORT ?? 4000);
// ✅ CORS CONFIG
const allowedOrigins = [
  "http://localhost:5173", // Vite dev
  "http://localhost:3000", // Next.js / CRA
  "https://yourfrontend.com", // production
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = "CORS policy: This origin is not allowed.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true, // 💥 REQUIRED for cookies
  })
);
app.use(express.json());

console.log(
  "DATABASE_URL:",
  process?.env?.DATABASE_URL,
  process?.env?.ACCESS_TOKEN_EXPIRES_IN
);

// Example type for an issue (adjust fields as needed)
interface Issue {
  id?: number;
  title?: string;
  description?: string;
  createdAt?: string;
  [k: string]: any;
}

// In-memory example storage (typed)
const issues: Issue[] = [];

async function main(): Promise<void> {
  // Mount routers
  // Public auth routes
  app.use("/api/auth", AuthRouter);

  // Protected routes — requireAuth middleware applied
  app.use("/api/user", requireAuth, UserRouter);
  // app.use("/api/tasks", requireAuth, TaskRouter);
  app.use("/api/story", requireAuth, StoryRouter);
  app.use("/api/project", requireAuth, ProjectRouter);
  app.use("/api/epic", requireAuth, EpicRouter);
  app.use("/api/bug", requireAuth, BugRouter);

  // Example GET endpoint to list issues
  app.get("/api/issues", (req: Request, res: Response) => {
    res.json(issues);
  });

  // Root endpoint
  app.get("/", (req: Request, res: Response) => {
    res.send("Jira Clone API is running");
  });

  // Connect Prisma then start server
  try {
    await prisma.$connect();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main().catch(async (e) => {
  console.error("Fatal error in main:", e);
  try {
    await prisma.$disconnect();
  } catch (err) {
    console.error("Error during disconnect:", err);
  }
  process.exit(1);
});
