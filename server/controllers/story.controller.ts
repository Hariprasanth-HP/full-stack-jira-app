import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const POSITION_STEP = 1000;

const createStory = async (req, res) => {
  try {
    const { description, priority, creator, dueDate, epicId, name } = req.body;

    if (!name || typeof name !== "string") {
      return res.status(400).json({ error: "name is required" });
    }

    // Transaction: create story and its KanbanCard atomically
    const result = await prisma.$transaction(async (tx) => {
      const story = await tx.story.create({
        data: {
          name,
          description: description ?? "",
          creator: creator ?? null,
          priority: priority ?? "Medium",
          dueDate: dueDate ? new Date(dueDate) : null,
          epicId: epicId ?? undefined,
          // createdAt: new Date(), // Prisma default now() is usually fine
        },
      });

      // compute next position in TODO lane (max + step)
      const aggr = await tx.kanbanCard.aggregate({
        _max: { position: true },
        where: { status: "TODO" },
      });
      const maxPos = aggr._max.position ?? 0;
      const position = maxPos + POSITION_STEP;

      const kanbanCard = await tx.kanbanCard.create({
        data: {
          status: "TODO",
          position,
          storyId: story.id,
        },
      });

      return { story, kanbanCard };
    });

    res.status(201).json("Story Created"); // returns { story, kanbanCard }
  } catch (e) {
    console.error("error when creating Story", e);
    res.status(500).json({ error: "Internal Server Error" });
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
function err(res, status = 500, message = "Internal Server Error") {
  return res.status(status).json({ success: false, error: message });
}
const deleteStory = async (req, res) => {
  try {
    const { id } = req.params;
    const story = await prisma.story.findUnique({
      where: { id: parseInt(id) },
      include: { bugs: true, tasks: true },
    });

    if (!story) return err(res, 404, "story not found.");
    console.log("story", story);

    if (
      (story.tasks && story.tasks.length > 0) ||
      (story.bugs && story.bugs.length > 0)
    ) {
      return err(
        res,
        400,
        "Story has Tasks or Bugs. Delete or move Tasks or Bugs before deleting the story."
      );
    }

    await prisma.story.delete({
      where: { id: parseInt(id) },
    });
    return res.status(200).json({ success: true, data: `Story ${id} deleted` });
  } catch (e) {
    console.log("errorr when getting Story", e);
    res.status(500).json({ error: e });
  }
};

export { createStory, deleteStory, getStory, getStorys, updateStory };
