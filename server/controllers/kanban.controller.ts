import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function getEpicKanbanCards(req, res) {
  try {
    const epicId = Number(req.params.epicId);
    if (isNaN(epicId)) {
      return res.status(400).json({ error: "Invalid epicId" });
    }

    const cards = await getEpicKanbanCardsFlat(epicId);
    return res.status(200).json({ success: true, data: cards });
  } catch (error) {
    console.error("❌ getEpicKanbanCards error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

type KanbanType = "story" | "task" | "bug";

async function getEpicKanbanCardsFlat(epicId: number) {
  if (isNaN(epicId)) throw new Error("invalid epicId");

  // fetch KanbanCards that are linked to stories/tasks/bugs under the epic
  const cards = await prisma.kanbanCard.findMany({
    where: {
      OR: [
        { story: { epicId } },
        { task: { story: { epicId } } },
        { bug: { story: { epicId } } },
      ],
    },
    orderBy: [{ status: "asc" }, { position: "asc" }],
    select: {
      id: true,
      status: true,
      position: true,
      story: {
        select: {
          id: true,
          name: true,
          description: true,
          priority: true,
          epicId: true,
          creator: true,
        },
      },
      task: {
        select: {
          id: true,
          name: true,
          description: true,
          priority: true,
          storyId: true,
          creator: true,

          story: {
            select: {
              id: true,
              name: true,
              description: true,
              priority: true,
              creator: true,
              epicId: true,
            },
          },
        },
      },
      bug: {
        select: {
          id: true,
          name: true,
          description: true,
          priority: true,
          storyId: true,
          creator: true,

          story: {
            select: {
              id: true,
              name: true,
              description: true,
              priority: true,
              creator: true,
              epicId: true,
            },
          },
        },
      },
    },
  });

  // normalize into flat shape
  const normalized = cards.map((c) => {
    if (c.story) {
      // Kanban card directly linked to a Story
      return {
        id: c.id,
        status: c.status,
        position: c.position,
        type: "story" as KanbanType,
        domainId: c.story.id,
        title: c.story.name ?? c.title ?? null,
        description: c.story.description ?? c.description ?? null,
        priority: c.story.priority ?? c.priority ?? null,
        assigneeId: c.assigneeId ?? null,
      };
    }

    if (c.task) {
      // Kanban card linked to a Task. Prefer task title/desc; optionally use parent story
      const task = c.task;
      // If you prefer parent story title instead of task name, use:
      // const preferParentStory = true; if (preferParentStory && task.story) ...
      return {
        id: c.id,
        status: c.status,
        position: c.position,
        type: "task" as KanbanType,
        domainId: task.id,
        title: task.name ?? task.story?.name ?? c.title ?? null,
        description:
          task.description ?? task.story?.description ?? c.description ?? null,
        priority: task.priority ?? task.story?.priority ?? c.priority ?? null,
        assigneeId: c.assigneeId ?? null,
      };
    }

    if (c.bug) {
      const bug = c.bug;
      return {
        id: c.id,
        status: c.status,
        position: c.position,
        type: "bug" as KanbanType,
        domainId: bug.id,
        title: bug.name ?? bug.story?.name ?? c.title ?? null,
        description:
          bug.description ?? bug.story?.description ?? c.description ?? null,
        priority: bug.priority ?? bug.story?.priority ?? c.priority ?? null,
        assigneeId: c.assigneeId ?? null,
      };
    }

    // shouldn't happen if DB constraint present; fallback to cached fields
    return {
      id: c.id,
      status: c.status,
      position: c.position,
      type: "story" as KanbanType,
      domainId: null,
      title: c.title ?? null,
      description: c.description ?? null,
      priority: c.priority ?? null,
      assigneeId: c.assigneeId ?? null,
    };
  });

  return normalized;
}
export async function updateKanban(req, res) {
  try {
    const { id, position, status } = req.body;
    if (!id) res.status(400).json("Invalid ID");
    await prisma.kanbanCard.update({
      where: { id },
      data: {
        position,
        status,
      },
    });
    res.status(201).json(`Kanban card ${id} updated`);
  } catch (error) {
    res.status(500).json(`Error when updating kanban`);
  }
}
