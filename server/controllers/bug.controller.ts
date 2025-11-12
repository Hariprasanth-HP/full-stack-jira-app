import { PrismaClient } from "@prisma/client";

// backend/src/controllers/bugController.js
const prisma = new PrismaClient();

function err(res, status = 500, message = "Internal Server Error") {
  return res.status(status).json({ success: false, error: message });
}

// CREATE bug
const createBug = async (req, res) => {
  try {
    const { name, description, storyId } = req.body;

    // Validation
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return err(res, 400, "Bug name is required.");
    }
    if (description && description.length > 255) {
      return err(res, 400, "Description must be at most 255 characters.");
    }
    if (storyId === undefined || storyId === null) {
      return err(res, 400, "storyId is required.");
    }
    const sid = parseInt(storyId);
    if (Number.isNaN(sid)) return err(res, 400, "storyId must be a number.");

    // Ensure story exists
    const story = await prisma.story.findUnique({ where: { id: sid } });
    if (!story) return err(res, 404, "Parent story not found.");

    // Create bug
    const bug = await prisma.bug.create({
      data: {
        name: name.trim(),
        description: description ?? null,
        storyId: sid,
      },
      include: { story: true },
    });

    return res.status(201).json({ success: true, data: bug });
  } catch (e) {
    // handle unique constraint violation (name)
    if (
      e.code === "P2002" &&
      e.meta &&
      e.meta.target &&
      e.meta.target.includes("name")
    ) {
      return err(res, 409, "Bug name already exists.");
    }
    console.error("createBug error:", e);
    return err(res, 500, "Failed to create bug.");
  }
};

// GET all bugs (optionally filter by storyId)
const getBugs = async (req, res) => {
  try {
    const { storyId } = req.params;
    const where = {};
    if (storyId !== undefined) {
      const sid = parseInt(storyId);
      if (Number.isNaN(sid)) return err(res, 400, "storyId must be a number.");
      where.storyId = sid;
    }
    console.log("storyIdstoryId", storyId, where);

    const bugs = await prisma.bug.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ success: true, data: bugs });
  } catch (e) {
    console.error("getBugs error:", e);
    return err(res, 500, "Failed to fetch bugs.");
  }
};

// GET single bug
const getBug = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (Number.isNaN(id)) return err(res, 400, "Invalid bug id.");

    const bug = await prisma.bug.findUnique({
      where: { id },
      include: { story: true },
    });
    if (!bug) return err(res, 404, "Bug not found.");

    return res.status(200).json({ success: true, data: bug });
  } catch (e) {
    console.error("getBug error:", e);
    return err(res, 500, "Failed to fetch bug.");
  }
};

// UPDATE bug
const updateBug = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (Number.isNaN(id)) return err(res, 400, "Invalid bug id.");

    const { name, description, storyId } = req.body;
    const data = {};

    if (name !== undefined) {
      if (!name || typeof name !== "string" || name.trim().length === 0) {
        return err(res, 400, "If provided, name must be a non-empty string.");
      }
      data.name = name.trim();
    }
    if (description !== undefined) {
      if (description && description.length > 255) {
        return err(res, 400, "Description must be at most 255 characters.");
      }
      data.description = description === null ? null : description;
    }
    if (storyId !== undefined) {
      const sid = parseInt(storyId);
      if (Number.isNaN(sid)) return err(res, 400, "storyId must be a number.");
      const story = await prisma.story.findUnique({ where: { id: sid } });
      if (!story) return err(res, 404, "Parent story not found.");
      data.storyId = sid;
    }

    const existing = await prisma.bug.findUnique({ where: { id } });
    if (!existing) return err(res, 404, "Bug not found.");

    const updated = await prisma.bug.update({
      where: { id },
      data,
      include: { story: true },
    });

    return res.status(200).json({ success: true, data: updated });
  } catch (e) {
    // handle unique name violation
    if (
      e.code === "P2002" &&
      e.meta &&
      e.meta.target &&
      e.meta.target.includes("name")
    ) {
      return err(res, 409, "Bug name already exists.");
    }
    console.error("updateBug error:", e);
    return err(res, 500, "Failed to update bug.");
  }
};

// DELETE bug
const deleteBug = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (Number.isNaN(id)) return err(res, 400, "Invalid bug id.");

    const existing = await prisma.bug.findUnique({ where: { id } });
    if (!existing) return err(res, 404, "Bug not found.");

    await prisma.bug.delete({ where: { id } });
    return res.status(200).json({ success: true, data: `Bug ${id} deleted` });
  } catch (e) {
    console.error("deleteBug error:", e);
    if (e.code === "P2003") {
      return err(res, 409, "Bug has dependent records and cannot be deleted.");
    }
    return err(res, 500, "Failed to delete bug.");
  }
};

export { createBug, getBugs, getBug, updateBug, deleteBug };
