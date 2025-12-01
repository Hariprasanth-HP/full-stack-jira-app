// backend/src/controllers/taskStatusController.js
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Standard error helper
function err(res, status = 500, message = "Internal Server Error") {
  return res.status(status).json({ success: false, error: message });
}

/**
 * CREATE TaskStatus
 * Body: { name, color?, sortOrder?, projectId }
 */
export const createTaskStatus = async (req, res) => {
  try {
    const {
      name,
      color,
      sortOrder: bodySortOrder,
      projectId: bodyProjectId,
    } = req.body;

    // Validate
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return err(res, 400, "Status name is required.");
    }
    const projectId = parseInt(bodyProjectId);
    if (Number.isNaN(projectId))
      return err(res, 400, "projectId is required and must be a number.");

    // Ensure project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) return err(res, 404, "Project not found.");

    // Compute sortOrder if not provided => append to end
    let sortOrder = typeof bodySortOrder === "number" ? bodySortOrder : null;
    if (sortOrder === null) {
      const last = await prisma.taskStatus.findFirst({
        where: { projectId },
        orderBy: { sortOrder: "desc" },
        select: { sortOrder: true },
      });
      sortOrder = (last?.sortOrder ?? -1) + 1;
    }

    // Create
    const created = await prisma.taskStatus.create({
      data: {
        name: name.trim(),
        color: color ?? null,
        sortOrder,
        projectId,
      },
    });

    return res.status(201).json({ success: true, data: created });
  } catch (e) {
    // Unique constraint on (projectId, name)
    if (e && e.code === "P2002") {
      return err(res, 409, "Status name already exists for this project.");
    }
    console.error("createTaskStatus error:", e);
    return err(res, 500, "Failed to create status.");
  }
};

/**
 * GET statuses for a project
 * Query: ?projectId=1
 */
export const getTaskStatusesByProject = async (req, res) => {
  try {
    const { projectId: qProjectId } = req.query;
    const projectId = parseInt(qProjectId);
    if (Number.isNaN(projectId))
      return err(res, 400, "projectId must be a number.");

    const statuses = await prisma.taskStatus.findMany({
      where: { projectId },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    return res.status(200).json({ success: true, data: statuses });
  } catch (e) {
    console.error("getTaskStatusesByProject error:", e);
    return err(res, 500, "Failed to fetch statuses.");
  }
};

/**
 * GET single status by id
 * Params: /:id
 */
export const getTaskStatus = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (Number.isNaN(id)) return err(res, 400, "Invalid status id.");

    const status = await prisma.taskStatus.findUnique({ where: { id } });
    if (!status) return err(res, 404, "Status not found.");

    return res.status(200).json({ success: true, data: status });
  } catch (e) {
    console.error("getTaskStatus error:", e);
    return err(res, 500, "Failed to fetch status.");
  }
};

/**
 * UPDATE status
 * Params: /:id
 * Body: { name?, color?, sortOrder? }
 */
export const updateTaskStatus = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (Number.isNaN(id)) return err(res, 400, "Invalid status id.");

    const { name, color, sortOrder } = req.body;
    const data = {};

    if (name !== undefined) {
      if (!name || typeof name !== "string" || name.trim().length === 0) {
        return err(res, 400, "If provided, name must be a non-empty string.");
      }
      data.name = name.trim();
    }
    if (color !== undefined) {
      data.color = color === null ? null : color;
    }
    if (sortOrder !== undefined) {
      const so = sortOrder === null ? null : parseInt(sortOrder);
      if (sortOrder !== null && Number.isNaN(so))
        return err(res, 400, "sortOrder must be a number or null.");
      data.sortOrder = so;
    }

    // Ensure exists
    const existing = await prisma.taskStatus.findUnique({ where: { id } });
    if (!existing) return err(res, 404, "Status not found.");

    const updated = await prisma.taskStatus.update({
      where: { id },
      data,
    });

    return res.status(200).json({ success: true, data: updated });
  } catch (e) {
    // Unique constraint on (projectId, name)
    if (e && e.code === "P2002") {
      return err(res, 409, "Status name already exists for this project.");
    }
    console.error("updateTaskStatus error:", e);
    return err(res, 500, "Failed to update status.");
  }
};

/**
 * DELETE status
 * Params: /:id
 *
 * Default: refuse delete if any Task still references this status.
 * If you prefer to allow deletion (and set tasks.statusId to null), use a transaction to clear tasks first.
 */
export const deleteTaskStatus = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (Number.isNaN(id)) return err(res, 400, "Invalid status id.");

    const status = await prisma.taskStatus.findUnique({
      where: { id },
      include: { tasks: true },
    });
    if (!status) return err(res, 404, "Status not found.");

    if (status.tasks && status.tasks.length > 0) {
      return err(
        res,
        400,
        "Status has tasks. Reassign or clear tasks before deleting."
      );
    }

    await prisma.taskStatus.delete({ where: { id } });
    return res
      .status(200)
      .json({ success: true, data: `Status ${id} deleted` });
  } catch (e) {
    // FK constraint (if any dependent rows exist)
    if (e && e.code === "P2003") {
      return err(
        res,
        409,
        "Status has dependent records and cannot be deleted."
      );
    }
    console.error("deleteTaskStatus error:", e);
    return err(res, 500, "Failed to delete status.");
  }
};
