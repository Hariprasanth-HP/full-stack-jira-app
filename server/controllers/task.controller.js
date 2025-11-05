const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const createTask = async (req, res) => {
  try {
    const { type, summary, description, priority, assignee, dueDate } =
      req.body;
    
     await prisma.tasks.create({
      data: {
        type,
        summary,
        description,
        priority,
        assignee,
        dueDate,
        createdAt:new Date().toISOString()
      },
    });

    // Fetch all tasks after creation
    const allTasks = await prisma.tasks.findMany({
      orderBy: {
        createdAt: 'desc' // Optional: orders by due date descending
      }
    });
    
    res.status(201).json(allTasks); // Changed to 201 for resource creation

  } catch (e) {
    console.log('errorr when creating task',e);
    
    res.status(500).json({ error: e });
  }
};
module.exports = { createTask };
