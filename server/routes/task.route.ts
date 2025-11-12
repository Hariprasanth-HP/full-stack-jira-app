import express from "express";
import {
  createTask,
  deleteTask,
  getTask,
  getTasks,
  updateTask,
} from "../controllers/task.controller";

const router = express.Router();

router.post("/create", createTask);
router.get("/:storyId", getTasks);
router.get("/get/:id", getTask);
router.put("/update/:id", updateTask);
router.delete("/delete/:id", deleteTask);
export default router;
