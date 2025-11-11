import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const createStory = async (req, res) => {
  try {
    const { description, priority, creator, dueDate, epicId, name } = req.body;

    await prisma.story.create({
      data: {
        description,
        priority,
        creator,
        name,
        dueDate,
        epicId,
        createdAt: new Date().toISOString(),
      },
    });
    res.status(201).json("Story Created"); // Changed to 201 for resource creation
  } catch (e) {
    console.log("errorr when creating Story", e);

    res.status(500).json({ error: e });
  }
};
// LIST epics (optionally by project)
const getStorys = async (req, res) => {
  try {
    const { epicId } = req.params;
    const where = {};
    if (epicId !== undefined) {
      const pid = parseInt(epicId);
      if (Number.isNaN(pid)) return err(res, 400, "epicId must be a number.");
      where.epicId = pid;
    }

    const epics = await prisma.story.findMany({
      where,
      orderBy: { createdAt: "desc" },
      // include: { stories: true },
    });
    return res.status(200).json({ success: true, data: epics });
  } catch (e) {
    console.error("getEpics error:", e);
    return err(res, 500, "Failed to fetch stories.");
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
