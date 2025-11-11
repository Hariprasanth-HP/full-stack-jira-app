import express from "express";
import {
  createBug,
  getBug,
  getBugs,
  updateBug,
  deleteBug,
} from "../controllers/bug.controller";

const router = express.Router();

router.post("/create", createBug);
router.get("/:storyId", getBugs);
router.get("/get/:id", getBug);
router.put("/update/:id", updateBug);
router.delete("/delete/:id", deleteBug);

export default router;
