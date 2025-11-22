import express from "express";
import {
  createCompany,
  deleteCompany,
  getCompany,
  getCompanys,
  updateCompany,
} from "../controllers/company.controller";

const router = express.Router();

// router.post("/create", createCompany);

/**
 * @swagger
 * /Company:
 *   get:
 *     summary: Retrieve a list of Companys
 *     responses:
 *       200:
 *         description: A list of Companys
 */
router.get("/", getCompanys);
router.get("/:id", getCompany);
router.put("/update/:id", updateCompany);
router.delete("/delete/:id", deleteCompany);
export default router;
