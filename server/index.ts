// src/index.ts
import express from "express";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import cors from "cors";

// import your routers / middleware (update paths as needed)
import AuthRouter from "./routes/auth/auth.route";
import UserRouter from "./routes/user.route";
import TeamRouter from "./routes/team.route";
import ProjectRouter from "./routes/project.route";
import TaskRouter from "./routes/task.route";
import ListRouter from "./routes/list.route";
import MemberRouter from "./routes/member.route";

import { requireAuth } from "./middleware/authMiddleware";

dotenv.config();

const app = express();
const prisma = new PrismaClient();
import swaggerUi from "swagger-ui-express";
import swaggerJSDoc from "swagger-jsdoc";
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

async function main(): Promise<void> {
  const swaggerOptions = {
    swaggerDefinition: {
      openapi: "3.0.0",
      info: {
        title: "My API",
        version: "1.0.0",
        description: "API documentation using Swagger",
      },
      servers: [
        {
          url: `http://localhost:${PORT}/api`,
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
    },
    apis: ["./routes/*.ts"], // Path to your API docs
  };

  const swaggerDocs = swaggerJSDoc(swaggerOptions);
  // Mount routers
  // Public auth routes
  app.use("/api/auth", AuthRouter);
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));
  // Protected routes — requireAuth middleware applied
  app.use("/api/user", requireAuth, UserRouter);
  app.use("/api/team", requireAuth, TeamRouter);
  app.use("/api/project", requireAuth, ProjectRouter);
  app.use("/api/list", requireAuth, ListRouter);
  app.use("/api/task", requireAuth, TaskRouter);
  app.use("/api/member", requireAuth, MemberRouter);

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
