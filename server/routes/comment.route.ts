import express from "express";
import {
  createComment,
  deleteComment,
  getComment,
  getComments,
  updateComment,
} from "../controllers/comment.controller";

const router = express.Router();

router.post("/", createComment);

/**
 * @swagger
 * /Comment:
 *   get:
 *     summary: Retrieve a list of Comments
 *     responses:
 *       200:
 *         description: A list of Comments
 */
router.get("/", getComments);
router.get("/:id", getComment);
router.post("/", createComment);
router.put("/:id", updateComment);
router.delete("/:id", deleteComment);
export default router;
