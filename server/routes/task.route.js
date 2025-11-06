const express = require("express");
const TaskController = require("../controllers/task.controller");

const router = express.Router();

router.post("/create", TaskController.createTask);
router.get("/get", TaskController.getTasks);
router.get("/get/:id", TaskController.getTask);
router.get("/get/feature/:id", TaskController.getFeatureTasks);
router.put("/update/:id", TaskController.updateTasks);
router.delete("/delete/:id", TaskController.deleteTask);

module.exports = router;