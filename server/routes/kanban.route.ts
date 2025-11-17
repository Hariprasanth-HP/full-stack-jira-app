import express from "express";
import {
  getEpicKanbanCards,
  updateKanban,
} from "../controllers/kanban.controller";

const router = express.Router();

router.get("/:epicId", getEpicKanbanCards);
router.patch("/:id", updateKanban);
export default router;
