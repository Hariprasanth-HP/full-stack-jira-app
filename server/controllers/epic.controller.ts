import { PrismaClient } from "@prisma/client";

// backend/src/controllers/epicController.js
const prisma = new PrismaClient();

function err(res, status = 500, message = "Internal Server Error") {
  return res.status(status).json({ success: false, error: message });
}

// CREATE epic
const createEpic = async (req, res) => {
  try {
    const { name, description, projectId, creator, priority, dueDate } =
      req.body;

    // Validation
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return err(res, 400, "Epic name is required.");
    }
    if (description && description.length > 255) {
      return err(res, 400, "Description must be at most 255 characters.");
    }
    if (!projectId) return err(res, 400, "projectId is required.");
    const pid = parseInt(projectId);
    if (Number.isNaN(pid)) return err(res, 400, "projectId must be a number.");

    // Ensure project exists
    const project = await prisma.project.findUnique({ where: { id: pid } });
    if (!project) return err(res, 404, "Project not found.");

    const epic = await prisma.epic.create({
      data: {
        name: name.trim(),
        description: description ?? null,
        projectId: pid,
        creator, // set from authenticated user
        priority: priority ?? "MEDIUM",
        dueDate: dueDate ? new Date(dueDate) : null,
      },
      include: { stories: true }, // ensures stories is returned (empty array if none)
    });

    return res.status(201).json({ success: true, data: epic });
  } catch (e) {
    // Unique constraint error (name)
    if (
      e.code === "P2002" &&
      e.meta &&
      e.meta.target &&
      e.meta.target.includes("name")
    ) {
      return err(res, 409, "Epic name already exists.");
    }
    console.error("createEpic error:", e);
    return err(res, 500, "Failed to create epic.");
  }
};

// LIST epics (optionally by project)
const getEpics = async (req, res) => {
  try {
    const { projectId } = req.params;
    const where = {};
    if (projectId !== undefined) {
      const pid = parseInt(projectId);
      if (Number.isNaN(pid))
        return err(res, 400, "projectId must be a number.");
      where.projectId = pid;
    }

    const epics = await prisma.epic.findMany({
      where,
      orderBy: { createdAt: "desc" },
      // include: { stories: true },
    });

    return res.status(200).json({ success: true, data: epics });
  } catch (e) {
    console.error("getEpics error:", e);
    return err(res, 500, "Failed to fetch epics.");
  }
};

// GET single epic
const getEpic = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (Number.isNaN(id)) return err(res, 400, "Invalid epic id.");

    const epic = await prisma.epic.findUnique({
      where: { id },
      include: { stories: true },
    });

    if (!epic) return err(res, 404, "Epic not found.");
    return res.status(200).json({ success: true, data: epic });
  } catch (e) {
    console.error("getEpic error:", e);
    return err(res, 500, "Failed to fetch epic.");
  }
};

// UPDATE epic
const updateEpic = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (Number.isNaN(id)) return err(res, 400, "Invalid epic id.");

    const { name, description, projectId } = req.body;
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
    if (projectId !== undefined) {
      const pid = parseInt(projectId);
      if (Number.isNaN(pid))
        return err(res, 400, "projectId must be a number.");
      const project = await prisma.project.findUnique({ where: { id: pid } });
      if (!project) return err(res, 404, "Project not found.");
      data.projectId = pid;
    }

    const existing = await prisma.epic.findUnique({ where: { id } });
    if (!existing) return err(res, 404, "Epic not found.");

    const updated = await prisma.epic.update({
      where: { id },
      data,
      include: { stories: true },
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
      return err(res, 409, "Epic name already exists.");
    }
    console.error("updateEpic error:", e);
    return err(res, 500, "Failed to update epic.");
  }
};

// DELETE epic
const deleteEpic = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (Number.isNaN(id)) return err(res, 400, "Invalid epic id.");

    // Decide policy: allow delete only if no stories, or cascade
    const epic = await prisma.epic.findUnique({
      where: { id },
      include: { stories: true },
    });
    if (!epic) return err(res, 404, "Epic not found.");

    if (epic.stories && epic.stories.length > 0) {
      // Safe default: prevent accidental data loss
      return err(
        res,
        400,
        "Epic has stories. Delete or move stories before deleting the epic."
      );
    }

    await prisma.epic.delete({ where: { id } });
    return res.status(200).json({ success: true, data: `Epic ${id} deleted` });
  } catch (e) {
    console.error("deleteEpic error:", e);
    if (e.code === "P2003") {
      return err(res, 409, "Epic has dependent records and cannot be deleted.");
    }
    return err(res, 500, "Failed to delete epic.");
  }
};
export { createEpic, getEpics, getEpic, updateEpic, deleteEpic };
