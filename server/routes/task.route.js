const express = require("express");
const TaskController = require("../controllers/task.controller");

const router = express.Router();

// Create task
router.post("/create", TaskController.createTask);

// // Get all tasks
// router.get("/tasks", TaskController.getAllTasks);

// // Get task by id
// router.get("/tasks/:id", TaskController.getTaskById);

// // Update task
// router.put("/tasks/:id", TaskController.updateTask);

// // Delete task
// router.delete("/tasks/:id", TaskController.deleteTask);

module.exports = router;