import express from "express";
import {
  createActivity,
  deleteActivity,
  getActivity,
  getActivities,
  updateActivity,
} from "../controllers/activity.controller";

const router = express.Router();

router.post("/", createActivity);

/**
 * @swagger
 * /Activity:
 *   get:
 *     summary: Retrieve a list of Activities
 *     responses:
 *       200:
 *         description: A list of Activities
 */
router.get("/", getActivities);
router.get("/:id", getActivity);
router.post("/", createActivity);
router.patch("/:id", updateActivity);
router.delete("/:id", deleteActivity);
export default router;
