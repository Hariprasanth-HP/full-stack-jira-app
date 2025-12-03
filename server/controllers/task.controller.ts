import { PrismaClient } from "@prisma/client";
import { Request } from "express";
import { log } from "node:console";
import { ParsedQs } from "qs";

// backend/src/controllers/taskController.js
const prisma = new PrismaClient();

function err(res, status = 500, message = "Internal Server Error") {
  return res.status(status).json({ success: false, error: message });
}
const POSITION_STEP = 1000;

// CREATE task
const createTask = async (req: any, res: any): Promise<void> => {
  try {
    const {
      name,
      description,
      projectId,
      parentTaskId = null,
      priority,
      dueDate,
      listId = null,
      assignedById = null,
      assigneeId = null,
      statusId = 0,
    } = req.body;

    // Validation
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return err(res, 400, "Task name is required.");
    }
    if (description && description.length > 255) {
      return err(res, 400, "Description must be at most 255 characters.");
    }
    if (projectId === undefined || projectId === null) {
      return err(res, 400, "projectId is required.");
    }
    const sid = parseInt(projectId, 10);
    if (Number.isNaN(sid)) return err(res, 400, "projectId must be a number.");

    // Ensure parent project exists
    const project = await prisma.project.findUnique({
      where: { id: sid },
    });
    if (!project) return err(res, 404, "Parent project not found.");
    const result = await prisma.task.create({
      data: {
        name: name.trim(),
        description: description ?? null,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        listId,
        projectId: sid,
        parentTaskId,
        assignedById,
        assigneeId,
        statusId,
      },
    });

    return res.status(201).json({ success: true, data: result });
  } catch (e) {
    // unique constraint violation (name)
    if (
      e.code === "P2002" &&
      e.meta &&
      e.meta.target &&
      e.meta.target.includes("name")
    ) {
      return err(res, 409, "Task name already exists.");
    }
    console.error("createTask error:", e);
    return err(res, 500, "Failed to create task.");
  }
};

// GET all tasks (optionally filter by projectId)
const getTasks = async (
  req: Request<unknown, unknown, any>,
  res: any
): Promise<void> => {
  try {
    const { projectId } = req.query;
    const where = {};
    if (projectId !== undefined) {
      const sid = parseInt(projectId, 10);
      if (Number.isNaN(sid))
        return err(res, 400, "projectId must be a number.");
      where.projectId = sid;
    }

    const tasks = await prisma.task.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { subTasks: true },
    });

    return res
      .status(200)
      .json({ success: true, data: tasks.filter((t) => !t.parentTaskId) });
  } catch (e) {
    console.error("getTasks error:", e);
    return err(res, 500, "Failed to fetch tasks.");
  }
};

// GET single task
const getTask = async (req: any, res: any): Promise<void> => {
  try {
    const id = parseInt(req.query.id, 10);
    if (Number.isNaN(id)) return err(res, 400, "Invalid task id.");

    const task = await prisma.task.findUnique({
      where: { id },
      include: { subTasks: true },
    });
    if (!task) return err(res, 404, "Task not found.");

    return res.status(200).json({ success: true, data: task });
  } catch (e) {
    console.error("getTask error:", e);
    return err(res, 500, "Failed to fetch task.");
  }
};
const updateTask = async (req: any, res: any): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return err(res, 400, "Invalid task id.");

    // Raw incoming values (we will use hasOwnProp to detect which were provided)
    const incoming = req.body || {};

    const {
      name,
      description,
      projectId,
      parentTaskId = null,
      priority,
      dueDate,
      listId = null,
      assignedById = null,
      assigneeId = null,
      statusId,
    } = incoming;

    // Helper to see if a field was provided in the request body (even if null)
    const has = (k: string) =>
      Object.prototype.hasOwnProperty.call(incoming, k);

    // Basic validation for fields that are provided
    const dataToUpdate: any = {};

    if (has("name")) {
      if (!name || typeof name !== "string" || name.trim().length === 0) {
        return err(res, 400, "If provided, name must be a non-empty string.");
      }
      dataToUpdate.name = name.trim();
    }

    if (has("description")) {
      if (description && description.length > 255) {
        return err(res, 400, "Description must be at most 255 characters.");
      }
      dataToUpdate.description = description === null ? null : description;
    }

    if (has("projectId")) {
      const sid = parseInt(projectId, 10);
      if (Number.isNaN(sid))
        return err(res, 400, "projectId must be a number.");
      const project = await prisma.project.findUnique({ where: { id: sid } });
      if (!project) return err(res, 404, "Parent project not found.");
      dataToUpdate.projectId = sid;
    }

    if (has("parentTaskId")) {
      // allow null to unset parent
      dataToUpdate.parentTaskId =
        parentTaskId === null ? null : parseInt(parentTaskId, 10);
      if (
        dataToUpdate.parentTaskId !== null &&
        Number.isNaN(dataToUpdate.parentTaskId)
      ) {
        return err(res, 400, "parentTaskId must be a number or null.");
      }
    }

    if (has("priority")) {
      dataToUpdate.priority = priority === null ? null : priority;
    }

    if (has("dueDate")) {
      dataToUpdate.dueDate = dueDate === null ? null : new Date(dueDate);
      if (dueDate !== null && isNaN(dataToUpdate.dueDate.getTime())) {
        return err(res, 400, "dueDate must be a valid date or null.");
      }
    }

    if (has("listId")) {
      dataToUpdate.listId = listId === null ? null : parseInt(listId, 10);
      if (dataToUpdate.listId !== null && Number.isNaN(dataToUpdate.listId)) {
        return err(res, 400, "listId must be a number or null.");
      }
    }

    if (has("assignedById")) {
      dataToUpdate.assignedById =
        assignedById === null ? null : parseInt(assignedById, 10);
      if (
        dataToUpdate.assignedById !== null &&
        Number.isNaN(dataToUpdate.assignedById)
      ) {
        return err(res, 400, "assignedById must be a number or null.");
      }
    }

    if (has("assigneeId")) {
      dataToUpdate.assigneeId =
        assigneeId === null ? null : parseInt(assigneeId, 10);
      if (
        dataToUpdate.assigneeId !== null &&
        Number.isNaN(dataToUpdate.assigneeId)
      ) {
        return err(res, 400, "assigneeId must be a number or null.");
      }
    }

    if (has("statusId")) {
      dataToUpdate.statusId = statusId === null ? null : parseInt(statusId, 10);
      if (
        dataToUpdate.statusId !== null &&
        Number.isNaN(dataToUpdate.statusId)
      ) {
        return err(res, 400, "statusId must be a number or null.");
      }
    }

    // fetch existing task
    const existing = await prisma.task.findUnique({
      where: { id },
      include: {
        status: true,
      },
    });
    if (!existing) return err(res, 404, "Task not found.");

    // Build diffs only for fields that were provided and actually changed
    const diffs: Array<{ field: string; from: any; to: any }> = [];

    const normalize = (val: any) => {
      if (val instanceof Date) return val.toISOString();
      return val === undefined ? null : val;
    };

    for (const key of Object.keys(dataToUpdate)) {
      let oldVal = existing[key];
      let newVal = dataToUpdate[key];
      if (key === "statusId") {
        const newStatusName = await prisma.taskStatus.findUnique({
          where: { id: dataToUpdate[key] },
        });
        if (newStatusName) {
          oldVal = existing?.status?.name;
          newVal = newStatusName?.name;
        }
        console.log("newStatusName", newStatusName, newVal);
      }
      // Normalize date-like values for comparison
      const oldN = oldVal instanceof Date ? oldVal.toISOString() : oldVal;
      const newN = newVal instanceof Date ? newVal.toISOString() : newVal;

      // Use JSON.stringify for safe deep compare of null/undefined/objects
      const same =
        (oldN === undefined && newN === null) ||
        (oldN === null && newN === undefined) ||
        JSON.stringify(oldN) === JSON.stringify(newN);

      if (!same) {
        diffs.push({
          field: key,
          from: oldVal === undefined ? null : oldVal,
          to: newVal === undefined ? null : newVal,
        });
      }
    }

    if (diffs.length === 0) {
      // nothing to change
      return res.status(200).json({
        success: true,
        message: "No changes detected.",
        data: existing,
      });
    }

    // Build a human-readable description
    const changesText = diffs
      .map((d) => {
        console.log("dddddddddddddddddd", d);

        const fromStr =
          d.from === null || d.from === undefined
            ? "null"
            : d.from instanceof Date
            ? d.from.toISOString()
            : String(d.from);
        const toStr =
          d.to === null || d.to === undefined
            ? "null"
            : d.to instanceof Date
            ? d.to.toISOString()
            : String(d.to);
        return `${d.field}: "${fromStr}" → "${toStr}"`;
      })
      .join("; ");

    const actorId = req.body?.userId ?? null; // adjust if your auth stores actor elsewhere

    // perform update + activity creation atomically
    const [updatedTask, createdActivity] = await prisma.$transaction([
      prisma.task.update({
        where: { id },
        data: dataToUpdate,
      }),
      prisma.activity.create({
        data: {
          kind: "TASK_UPDATE", // matches your ActivityKind enum
          description: `Task updated — ${changesText}`,
          metadata: {
            diffs,
            actorId,
            timestamp: new Date().toISOString(),
          },
          taskId: id,
          userId: actorId,
        },
        include: {
          user: true,
        },
      }),
    ]);

    return res
      .status(200)
      .json({ success: true, data: updatedTask, activity: createdActivity });
  } catch (e: any) {
    // unique name violation
    if (
      e &&
      (e.code === "P2002" || e?.meta?.code === "P2002") &&
      e.meta &&
      e.meta.target &&
      e.meta.target.includes("name")
    ) {
      return err(res, 409, "Task name already exists.");
    }

    console.error("updateTask error:", e);
    return err(res, 500, "Failed to update task.");
  }
};

// DELETE task
const deleteTask = async (req: any, res: any): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return err(res, 400, "Invalid task id.");

    const existing = await prisma.task.findUnique({
      where: { id },
      include: { subTasks: true },
    });
    if (!existing) return err(res, 404, "Task not found.");
    if (existing.subTasks.length > 0) {
      return err(res, 400, "Task has subtasks. Delete them first.");
    }
    await prisma.task.delete({
      where: { id },
      include: { subTasks: true },
    });
    return res?.status(200).json({ success: true, data: `Task ${id} deleted` });
  } catch (e) {
    console.error("deleteTask error:", e);
    if (e.code === "P2003") {
      return err(res, 409, "Task has dependent records and cannot be deleted.");
    }
    return err(res, 500, "Failed to delete task.");
  }
};

export { createTask, getTasks, getTask, updateTask, deleteTask };
