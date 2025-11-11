import express from "express";
import {
  createProject,
  deleteProject,
  getProject,
  getProjects,
  updateProject,
} from "../controllers/project.controller";
const router = express.Router();

router.post("/create", createProject);
router.get("/:id", getProjects);
router.get("/get/:id", getProject);
router.put("/update/:id", updateProject);
router.delete("/:id", deleteProject);
export default router;
