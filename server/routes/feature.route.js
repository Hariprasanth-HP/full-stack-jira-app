const express = require("express");
const FeatureController = require("../controllers/feature.controller");

const router = express.Router();

router.post("/create", FeatureController.createFeature);
router.get("/get", FeatureController.getFeatures);
router.get("/get/:id", FeatureController.getFeature);
router.put("/update/:id", FeatureController.updateFeature);
router.delete("/delete/:id", FeatureController.deleteFeature);

module.exports = router;