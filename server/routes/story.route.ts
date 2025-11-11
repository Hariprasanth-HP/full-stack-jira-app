import express from "express";
import {
  createStory,
  deleteStory,
  getStory,
  getStorys,
  updateStory,
} from "../controllers/story.controller";

const router = express.Router();

router.post("/create", createStory);
router.get("/:epicId", getStorys);
router.get("/get/:id", getStory);
router.put("/update/:id", updateStory);
router.delete("/:id", deleteStory);
export default router;
