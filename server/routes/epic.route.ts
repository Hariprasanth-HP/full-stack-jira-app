import express from "express";
import {
  createEpic,
  deleteEpic,
  getEpic,
  getEpics,
  updateEpic,
} from "../controllers/epic.controller";

const router = express.Router();

router.post("/create", createEpic);
router.get("/get", getEpics);
router.get("/get/:id", getEpic);
router.put("/update/:id", updateEpic);
router.delete("/delete/:id", deleteEpic);

export default router;
