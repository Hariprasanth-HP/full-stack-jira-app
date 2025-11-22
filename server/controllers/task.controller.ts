import { PrismaClient } from "@prisma/client";
import { Request } from "express";
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
    const result = await prisma.$transaction(async (tx) => {
      const task = await tx.task.create({
        data: {
          name: name.trim(),
          description: description ?? null,
          projectId: sid,
          priority,
          dueDate,
          parentTaskId,
        },
      });
      return task;
    });
    // Create task
    console.log("resultresultresult", result);

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
    });

    return res.status(200).json({ success: true, data: tasks });
  } catch (e) {
    console.error("getTasks error:", e);
    return err(res, 500, "Failed to fetch tasks.");
  }
};

// GET single task
const getTask = async (req: any, res: any): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
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

// UPDATE task
const updateTask = async (req: any, res: any): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return err(res, 400, "Invalid task id.");

    const {
      name,
      description,
      projectId,
      parentTaskId = null,
      priority,
      dueDate,
    } = req.body;
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
      const sid = parseInt(projectId, 10);
      if (Number.isNaN(sid))
        return err(res, 400, "projectId must be a number.");
      const project = await prisma.project.findUnique({ where: { id: sid } });
      if (!project) return err(res, 404, "Parent project not found.");
      data.projectId = sid;
    }

    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) return err(res, 404, "Task not found.");

    const updated = await prisma.task.update({
      where: { id },
      data: { ...data, parentTaskId, priority, dueDate },
    });

    return res.status(200).json({ success: true, data: updated });
  } catch (e) {
    // unique name violation
    if (
      e.code === "P2002" &&
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

    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) return err(res, 404, "Task not found.");

    await prisma.task.delete({ where: { id } });
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
