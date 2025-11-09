import express from "express";
import {
  createUser,
  deleteUser,
  getUser,
  getUsers,
  updateUser,
} from "../controllers/user.controller";

const router = express.Router();

// router.post("/create", createUser);
router.get("/", getUsers);
router.get("/get/:id", getUser);
router.put("/update/:id", updateUser);
router.delete("/delete/:id", deleteUser);
export default router;
