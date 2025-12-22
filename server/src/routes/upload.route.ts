// routes/upload.routes.js
import express, { Request, Response } from "express";

import upload from "../middleware/upload";

const router = express.Router();

router.post("/image", upload.array("images", 5), (req: Request, res: Response) => {
  const uploadedImages = req.files.map((file) => ({
    url: file.path,
    publicId: file.filename,
  }));

  res.status(200).json({
    success: true,
    images: uploadedImages,
  });
});

export default router;
