import { PrismaClient } from "@prisma/client";

// backend/src/controllers/TeamController.js
const prisma = new PrismaClient();

// Helper: standard error response
function err(res, status = 500, message = "Internal Server Error") {
  return res.status(status).json({ success: false, error: message });
}

// CREATE Team
const createTeam = async (req, res) => {
  try {
    const { name, about, creatorId: bodyCreatorId } = req.body;

    // Basic validation
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return err(res, 400, "Team name is required.");
    }

    // Prefer authenticated user, fallback to body creatorId
    // (assumes you set req.user when authenticated — adapt if different)
    const authUser = req.user || null;
    const effectiveCreatorId = authUser?.id ?? (bodyCreatorId ? parseInt(bodyCreatorId, 10) : null);

    // If creatorId provided, ensure user exists (also get their email/name)
    let creatorUser = null;
    if (effectiveCreatorId) {
      creatorUser = await prisma.user.findUnique({
        where: { id: effectiveCreatorId },
        select: { id: true, email: true, name: true },
      });
      if (!creatorUser) return err(res, 400, "Creator user not found.");
    }

    // Create Team and add creator as a member (if present) in a transaction
    // If no creator, we still create the team but skip member creation.
    let createdTeam = null;
    if (creatorUser) {
      const [team] = await prisma.$transaction([
        prisma.team.create({
          data: {
            name: name.trim(),
            about: about ?? "",
            creatorId: creatorUser.id,
          },
        }),
        // We can't create a member until we know the created team's id,
        // so we'll run a two-step transaction: create team, then create member.
      ]);

      // create the member row for the creator. Use try/catch for unique constraint
      try {
        await prisma.teamMember.create({
          data: {
            teamId: team.id,
            userId: creatorUser.id,
            email: creatorUser.email.toLowerCase().trim(),
            name: creatorUser.name ?? null,
            role: "OWNER", // change to your enum value if applicable
          },
        });
      } catch (e) {
        // If the unique constraint fires (teamId + email), ignore — the user is already a member.
        if (!(e && e.code === "P2002")) {
          throw e; // rethrow other errors so outer catch handles them
        }
      }

      // fetch the created team with members to return
      createdTeam = await prisma.team.findUnique({
        where: { id: team.id },
        include: { members: true, projects: true },
      });
    } else {
      // No creator supplied — just create the team
      const team = await prisma.team.create({
        data: {
          name: name.trim(),
          about: about ?? "",
          creatorId: null,
        },
      });

      createdTeam = await prisma.team.findUnique({
        where: { id: team.id },
        include: { members: true, projects: true },
      });
    }

    return res.status(201).json({ success: true, data: createdTeam });
  } catch (e) {
    // Handle unique constraint violation on team name
    if (
      e &&
      e.code === "P2002" &&
      e.meta &&
      e.meta.target &&
      e.meta.target.includes("name")
    ) {
      return err(res, 409, "Team name already exists.");
    }
    console.error("createTeam error:", e);
    return err(res, 500, "Failed to create Team.");
  }
};

async function getTeamsFromUser(req: Request, res: Response) {
  try {
    const {user} = req.body; // your logged-in user

    const teams = await prisma.team.findMany({
      where: {
        members: {
          some: {
            OR: [
              { email: user.email.toLowerCase().trim() },
              { userId: user.id }
            ],
          },
        },
      },
      include: {
        members: true,
        projects: true,
      },
    });

    return res.status(200).json({ success: true, data: teams });
  } catch (err) {
    console.error("getMyTeams error:", err);
    return res.status(500).json({ message: "Failed to fetch teams." });
  }
}


const addUsersToTeam = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (Number.isNaN(id)) return err(res, 400, "Invalid Team id.");

    const { members } = req.body;

    // Validate fields if provided
    const data = {};
    if (members !== undefined) {
      if (!members || !Array.isArray(members) || members.trim().length === 0) {
        return err(res, 400, "If provided, members must be an array.");
      }
      data.members = members;
    }

    // Optionally change creator (ensure user exists)
    if (creatorId !== undefined) {
      if (creatorId === null) {
        data.creatorId = null;
      } else {
        const parsed = parseInt(creatorId);
        if (Number.isNaN(parsed))
          return err(res, 400, "creatorId must be a number or null");
        const user = await prisma.user.findUnique({ where: { id: parsed } });
        if (!user) return err(res, 400, "Creator user not found.");
        data.creatorId = parsed;
      }
    }

    // Ensure Team exists
    const existing = await prisma.team.findUnique({ where: { id } });
    if (!existing) return err(res, 404, "Team not found.");

    const updated = await prisma.team.update({
      where: { id },
      data,
      include: { projects: true },
    });

    return res.status(200).json({ success: true, data: updated });
  } catch (e) {
    // Unique violation on name
    if (
      e.code === "P2002" &&
      e.meta &&
      e.meta.target &&
      e.meta.target.includes("name")
    ) {
      return err(res, 409, "Team name already exists.");
    }
    console.error("updateTeam error:", e);
    return err(res, 500, "Failed to update Team.");
  }
};

// GET all Team (optionally filter by creator)
const getTeams = async (req, res) => {
  try {
    const { creatorId } = req.query;
    const where = {};

    if (creatorId) {
      const id = parseInt(creatorId);
      if (Number.isNaN(id)) return err(res, 400, "creatorId must be a number");
      where.creatorId = id;
    } else {
      return err(res, 500, "Creator Id should be sent");
    }

    const Team = await prisma.team.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { members: true },
    });

    return res.status(200).json({ success: true, data: Team });
  } catch (e) {
    console.error("getTeam error:", e);
    return err(res, 500, "Failed to fetch Team.");
  }
};

// GET single Team by id (includes projects)
const getTeam = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (Number.isNaN(id)) return err(res, 400, "Invalid Team id.");

    const Team = await prisma.team.findUnique({
      where: { id },
      include: { members: true },
    });

    if (!Team) return err(res, 404, "Team not found.");

    return res.status(200).json({ success: true, data: Team });
  } catch (e) {
    console.error("getTeam error:", e);
    return err(res, 500, "Failed to fetch Team.");
  }
};

// UPDATE Team
const updateTeam = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (Number.isNaN(id)) return err(res, 400, "Invalid Team id.");

    const { name, about, creatorId } = req.body;

    // Validate fields if provided
    const data = {};
    if (name !== undefined) {
      if (!name || typeof name !== "string" || name.trim().length === 0) {
        return err(res, 400, "If provided, name must be a non-empty string.");
      }
      data.name = name.trim();
    }
    if (about !== undefined) {
      if (about && about.length > 255) {
        return err(res, 400, "About must be at most 255 characters.");
      }
      data.about = about === null ? null : about;
    }

    // Optionally change creator (ensure user exists)
    if (creatorId !== undefined) {
      if (creatorId === null) {
        data.creatorId = null;
      } else {
        const parsed = parseInt(creatorId);
        if (Number.isNaN(parsed))
          return err(res, 400, "creatorId must be a number or null");
        const user = await prisma.user.findUnique({ where: { id: parsed } });
        if (!user) return err(res, 400, "Creator user not found.");
        data.creatorId = parsed;
      }
    }

    // Ensure Team exists
    const existing = await prisma.team.findUnique({ where: { id } });
    if (!existing) return err(res, 404, "Team not found.");

    const updated = await prisma.team.update({
      where: { id },
      data,
      include: { projects: true },
    });

    return res.status(200).json({ success: true, data: updated });
  } catch (e) {
    // Unique violation on name
    if (
      e.code === "P2002" &&
      e.meta &&
      e.meta.target &&
      e.meta.target.includes("name")
    ) {
      return err(res, 409, "Team name already exists.");
    }
    console.error("updateTeam error:", e);
    return err(res, 500, "Failed to update Team.");
  }
};

// DELETE Team
// Default safety: disallow deleting if projects exist. If you prefer cascade, adjust logic.
const deleteTeam = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (Number.isNaN(id)) return err(res, 400, "Invalid Team id.");

    const Team = await prisma.team.findUnique({
      where: { id },
      include: { projects: true },
    });
    if (!Team) return err(res, 404, "Team not found.");

    if (Team.projects && Team.projects.length > 0) {
      return err(
        res,
        400,
        "Team has projects. Delete or detach projects before deleting the Team."
      );
    }

    await prisma.team.delete({ where: { id } });
    return res.status(200).json({ success: true, data: `Team ${id} deleted` });
  } catch (e) {
    console.error("deleteTeam error:", e);
    // If DB refuses if there are dependent rows not caught above, return 409
    if (e.code === "P2003") {
      return err(res, 409, "Team has dependent records and cannot be deleted.");
    }
    return err(res, 500, "Failed to delete Team.");
  }
};

export {
  createTeam,
  getTeams,
  getTeam,
  updateTeam,
  deleteTeam,
  addUsersToTeam,
  getTeamsFromUser
};
