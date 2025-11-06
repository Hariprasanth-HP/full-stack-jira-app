const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const createTask = async (req, res) => {
  try {
    const { type, summary, description, priority, assignee, dueDate,featureId } =
      req.body;

    await prisma.tasks.create({
      data: {
        type,
        summary,
        description,
        priority,
        assignee,
        dueDate,
        featureId:parseInt(featureId),
        createdAt: new Date().toISOString(),
      },
    });
    res.status(201).json("Task Created"); // Changed to 201 for resource creation
  } catch (e) {
    console.log("errorr when creating task", e);

    res.status(500).json({ error: e });
  }
};
const getTasks = async (_, res) => {
  try {
    const allTasks = await prisma.tasks.findMany({
      orderBy: {
        createdAt: "desc", // Optional: orders by due date descending
      },
    });
    res.status(200).json(allTasks); // Changed to 201 for resource creation
  } catch (e) {
    console.log("errorr when getting task", e);
    res.status(500).json({ error: e });
  }
};

const getFeatureTasks = async (req, res) => {
  try {
    const {id}=req.params
    const allTasks = await prisma.tasks.findMany({
      where: {
        featureId: parseInt(id), // Optional: orders by due date descending
      },
    });
    res.status(200).json(allTasks); // Changed to 201 for resource creation
  } catch (e) {
    console.log("errorr when getting task", e);
    res.status(500).json({ error: e });
  }
};
const getTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await prisma.tasks.findUnique({
      where: { id: parseInt(id) },
    });
    if (!task) res.status(400).json("No Task found");
    res.status(200).json(task); // Changed to 201 for resource creation
  } catch (e) {
    console.log("errorr when getting task", e);
    res.status(500).json({ error: e });
  }
};
const updateTasks = async (req, res) => {
  try {
    const { type, summary, description, priority, assignee, dueDate, id } =
      req.body;
    await prisma.tasks.update({
      where: { id },
      data: {
        type,
        summary,
        description,
        priority,
        assignee,
        dueDate,
      },
    });
    res.status(201).json("Task updated"); // Changed to 201 for resource creation
  } catch (e) {
    console.log("errorr when getting task", e);
    res.status(500).json({ error: e });
  }
};
const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.tasks.delete({
      where: { id: parseInt(id) },
    });
    res.status(201).json("Task Deleted"); // Changed to 201 for resource creation
  } catch (e) {
    console.log("errorr when getting task", e);
    res.status(500).json({ error: e });
  }
};

module.exports = { createTask, getTasks, updateTasks, deleteTask, getTask,getFeatureTasks };
