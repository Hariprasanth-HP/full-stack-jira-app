// server.js or routes/comments.js
import express from "express";
import {
  createComment,
  getComments,
  getComment,
  updateComment,
  deleteComment,
} from "../controllers/comment.controller";

const router = express.Router();

router.post("/", createComment);
router.get("/comments", getComments);
router.get("/comments/:id", getComment);
router.patch("/comments/:id", updateComment);
router.delete("/comments/:id", deleteComment);

export default router;
