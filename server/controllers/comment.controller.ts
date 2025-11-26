// controllers/commentController.js
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// simple uniform error responder
function err(res, status = 500, message = "Internal Server Error") {
  return res.status(status).json({ success: false, error: message });
}

const TARGET_KEYS = ["epicId", "storyId", "taskId", "bugId"];

/**
 * Helper: extract & validate exactly one target id from body/query
 * Returns { key, id } or throws (returns an error response when used with res)
 */
function pickSingleTargetFrom(obj, res) {
  const provided = TARGET_KEYS.map((k) => ({ key: k, val: obj[k] })).filter(
    (p) => p.val !== undefined && p.val !== null && String(p.val) !== ""
  );

  if (provided.length === 0) {
    return { error: "One of epicId, storyId, taskId or bugId is required." };
  }
  if (provided.length > 1) {
    return {
      error:
        "Provide exactly one of epicId, storyId, taskId, or bugId (not multiple).",
    };
  }

  const { key, val } = provided[0];
  const parsed = parseInt(String(val), 10);
  if (Number.isNaN(parsed)) {
    return { error: `${key} must be a number.` };
  }
  return { key, id: parsed };
}

/**
 * POST /comments
 * body: { content, authorId, epicId?, storyId?, taskId?, bugId?, parentId? }
 */
export const createComment = async (req, res) => {
  try {
    const { content, authorId, parentId } = req.body;

    if (!content || typeof content !== "string" || !content.trim()) {
      return err(
        res,
        400,
        "`content` is required and must be a non-empty string."
      );
    }
    if (!authorId || Number.isNaN(parseInt(authorId, 10))) {
      return err(res, 400, "`authorId` is required and must be a number.");
    }

    const target = pickSingleTargetFrom(req.body, res);
    if (target.error) return err(res, 400, target.error);

    const data = {
      content: content.trim(),
      authorId: parseInt(authorId, 10),
      parentId:
        parentId !== undefined && parentId !== null
          ? parseInt(parentId, 10)
          : null,
    };

    // attach the correct foreign key column
    data[target.key] = target.id;

    // if parentId provided, ensure parent exists and belongs to same target (recommended)
    if (data.parentId) {
      const parent = await prisma.comment.findUnique({
        where: { id: data.parentId },
      });
      if (!parent) return err(res, 400, "Parent comment not found.");
      // ensure parent is under same target (prevent cross-target replies)
      const mismatched =
        (target.key === "epicId" && parent.epicId !== target.id) ||
        (target.key === "storyId" && parent.storyId !== target.id) ||
        (target.key === "taskId" && parent.taskId !== target.id) ||
        (target.key === "bugId" && parent.bugId !== target.id);
      if (mismatched)
        return err(res, 400, "Parent comment must belong to the same target.");
    }

    const created = await prisma.comment.create({
      data,
      include: {
        author: { select: { id: true, username: true, email: true } },
      },
    });

    return res.status(201).json({ success: true, data: created });
  } catch (e) {
    console.error("createComment error:", e);
    return err(res, 500, "Failed to create comment.");
  }
};

/**
 * GET /comments
 * Query params: epicId|storyId|taskId|bugId (exactly one), limit?, cursor?
 * Returns top-level comments (parentId == null) with immediate replies & author.
 */
export const getComments = async (req, res) => {
  try {
    // pick target (like { key: 'epicId', id: 1 })
    const target = pickSingleTargetFrom(req.query, res);
    if (target.error) return err(res, 400, target.error);
    const { key: targetKey, id: targetId } = target;

    // ordering options (optional query params)
    const topOrder = req.query.topOrder === "asc" ? "asc" : "desc"; // top-level order
    const replyOrder = req.query.replyOrder === "desc" ? "desc" : "asc"; // replies order

    // Fetch ALL comments belonging to this target (roots + replies)
    // IMPORTANT: this relies on replies having the same targetKey set (recommended).
    const rows = await prisma.comment.findMany({
      where: {
        [targetKey]: targetId,
        isDeleted: false,
      },
      include: { author: true },
      orderBy: { createdAt: "asc" }, // fetch ascending so build preserves chronological order
    });

    // build tree util - preserves order of 'rows' (we fetched asc)
    function buildTree(flat) {
      // sort by createdAt ascending so replies are chronological
      flat.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

      const map = new Map(
        flat.map((item) => [item.id, { ...item, replies: [] }])
      );
      const roots = [];

      for (const item of flat) {
        const node = map.get(item.id);
        if (item.parentId) {
          const parent = map.get(item.parentId);
          if (parent) parent.replies.push(node);
          else roots.push(node); // orphaned reply -> treat as root
        } else {
          roots.push(node);
        }
      }

      return roots;
    }

    const treeAsc = buildTree(rows, { replyOrder }); // replies ordered per replyOrder

    // Top-level order: convert to requested topOrder
    const tree =
      topOrder === "asc"
        ? treeAsc.reverse()
        : treeAsc.reverse() && treeAsc.reverse() && treeAsc.slice().reverse()
        ? treeAsc.slice().reverse()
        : treeAsc;
    // simpler: produce top-level newest-first when topOrder === 'desc'
    // we fetched rows ascending, so roots are ascending; to get newest-first, reverse roots:
    const finalTree = topOrder === "asc" ? treeAsc : treeAsc.slice().reverse();

    return res.status(200).json({
      success: true,
      data: finalTree,
      meta: {
        total: rows.length,
        topOrder,
        replyOrder,
      },
    });
  } catch (e) {
    console.error("getCommentsTree error:", e);
    return err(res, 500, "Failed to fetch comments.");
  }
};

/**
 * GET /comments/:id
 * Returns comment with author and immediate replies
 */
export const getComment = async (req, res) => {
  try {
    const { id } = req.params;
    const parsed = parseInt(String(id), 10);
    if (Number.isNaN(parsed)) return err(res, 400, "id must be a number.");

    const comment = await prisma.comment.findUnique({
      where: { id: parsed },
      include: {
        author: { select: { id: true, username: true, email: true } },
        replies: {
          where: { isDeleted: false },
          include: { author: { select: { id: true, username: true } } },
        },
      },
    });
    if (!comment) return err(res, 404, "Comment not found.");
    return res.status(200).json({ success: true, data: comment });
  } catch (e) {
    console.error("getComment error:", e);
    return err(res, 500, "Failed to fetch comment.");
  }
};

/**
 * PATCH /comments/:id
 * body: { content? }
 * Only allows partial updates to content. (Add permission checks in production)
 */
export const updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const parsed = parseInt(String(id), 10);
    if (Number.isNaN(parsed)) return err(res, 400, "id must be a number.");

    const { content } = req.body;
    if (
      content === undefined ||
      (typeof content === "string" && !content.trim())
    ) {
      return err(
        res,
        400,
        "`content` is required and must be a non-empty string."
      );
    }

    const updated = await prisma.comment.update({
      where: { id: parsed },
      data: { content: content.trim() },
      include: { author: { select: { id: true, username: true } } },
    });

    return res.status(200).json({ success: true, data: updated });
  } catch (e) {
    console.error("updateComment error:", e);
    if (e?.code === "P2025") return err(res, 404, "Comment not found.");
    return err(res, 500, "Failed to update comment.");
  }
};

/**
 * DELETE /comments/:id
 * Query:
 *   soft=true  => perform soft-delete (isDeleted = true)
 *   force=true => recursively delete replies (hard delete)
 *
 * If comment has replies and force isn't provided, returns 400.
 */
async function deleteRepliesRecursive(tx, parentId) {
  const replies = await tx.comment.findMany({ where: { parentId } });
  for (const r of replies) {
    await deleteRepliesRecursive(tx, r.id);
    await tx.comment.delete({ where: { id: r.id } });
  }
}

export const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const parsed = parseInt(String(id), 10);
    if (Number.isNaN(parsed)) return err(res, 400, "id must be a number.");

    const { soft, force } = req.query; // soft=true or force=true

    const comment = await prisma.comment.findUnique({
      where: { id: parsed },
      include: { replies: true },
    });
    if (!comment) return err(res, 404, "Comment not found.");

    // soft-delete option (keeps replies)
    if (String(soft) === "true") {
      const updated = await prisma.comment.update({
        where: { id: parsed },
        data: { isDeleted: true },
      });
      return res.status(200).json({ success: true, data: updated });
    }

    // if has replies and no force -> block
    if (
      comment.replies &&
      comment.replies.length > 0 &&
      String(force) !== "true"
    ) {
      return err(
        res,
        400,
        "Comment has replies; pass ?force=true to delete recursively or ?soft=true to soft-delete."
      );
    }

    // recursive hard delete in a transaction (safe)
    await prisma.$transaction(async (tx) => {
      if (String(force) === "true") {
        await deleteRepliesRecursive(tx, parsed);
      }
      await tx.comment.delete({ where: { id: parsed } });
    });

    return res
      .status(200)
      .json({ success: true, data: `Comment ${parsed} deleted` });
  } catch (e) {
    console.error("deleteComment error:", e);
    if (e?.code === "P2025") return err(res, 404, "Comment not found.");
    return err(res, 500, "Failed to delete comment.");
  }
};
