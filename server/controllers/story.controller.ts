import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const createStory = async (req, res) => {
  try {
    const { summary, description, priority, assignee, dueDate } = req.body;

    await prisma.Storys.create({
      data: {
        type: "Story",
        summary,
        description,
        priority,
        assignee,
        dueDate,
        createdAt: new Date().toISOString(),
      },
    });
    res.status(201).json("Story Created"); // Changed to 201 for resource creation
  } catch (e) {
    console.log("errorr when creating Story", e);

    res.status(500).json({ error: e });
  }
};
const getStorys = async (_, res) => {
  try {
    const allStorys = await prisma.Storys.findMany({
      orderBy: {
        createdAt: "desc", // Optional: orders by due date descending
      },
    });
    res.status(200).json(allStorys); // Changed to 201 for resource creation
  } catch (e) {
    console.log("errorr when getting Story", e);
    res.status(500).json({ error: e });
  }
};

const getStory = async (req, res) => {
  try {
    const { id } = req.params;
    const Story = await prisma.Storys.findUnique({
      where: { id: parseInt(id) },
    });
    if (!Story) res.status(400).json("No Story found");
    res.status(200).json(Story); // Changed to 201 for resource creation
  } catch (e) {
    console.log("errorr when getting Story", e);
    res.status(500).json({ error: e });
  }
};
const updateStory = async (req, res) => {
  try {
    const { id } = req.params;
    const { summary, description, priority, assignee, dueDate } = req.body;
    await prisma.Storys.update({
      where: { id: parseInt(id) },
      data: {
        type: "Story",
        summary,
        description,
        priority,
        assignee,
        dueDate,
      },
    });
    res.status(201).json("Story updated"); // Changed to 201 for resource creation
  } catch (e) {
    console.log("errorr when getting Story", e);
    res.status(500).json({ error: e });
  }
};
const deleteStory = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.Storys.delete({
      where: { id: parseInt(id) },
    });
    res.status(201).json("Story Deleted"); // Changed to 201 for resource creation
  } catch (e) {
    console.log("errorr when getting Story", e);
    res.status(500).json({ error: e });
  }
};

export { createStory, deleteStory, getStory, getStorys, updateStory };
