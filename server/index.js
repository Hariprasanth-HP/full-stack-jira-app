const express = require("express");
const cors = require("cors");
const db = require("./db");
const dotenv = require("dotenv");

const app = express();
const {PrismaClient} =require("@prisma/client");
const TaskRouter = require("./routes/task.route");
const prisma = new PrismaClient()
const PORT = 4000;
dotenv.config();
// Middleware
app.use(cors());
app.use(express.json());
console.log("eeeeeeeeeee", process?.env?.DATABASE_URL);
// Example in-memory storage
const issues = [];

async function main() {
  console.log("issues", issues);

  // POST endpoint to create an issue
  app.use("/api/tasks",TaskRouter);

  // GET endpoint to list issues
  app.get("/api/issues", (req, res) => {
    res.json(issues);
  });

  // Root endpoint
  app.get("/", (req, res) => {
    res.send("Jira Clone API is running");
  });

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

main().then(async () => {
  console.log('connected');
  
    await prisma.$connect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
