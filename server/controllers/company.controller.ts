import { PrismaClient } from "@prisma/client";

// backend/src/controllers/CompanyController.js
const prisma = new PrismaClient();

// Helper: standard error response
function err(res, status = 500, message = "Internal Server Error") {
  return res.status(status).json({ success: false, error: message });
}

// CREATE Company
const createCompany = async (req, res) => {
  try {
    const { name, about, creatorId } = req.body;

    // Basic validation
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return err(res, 400, "Company name is required.");
    }
    if (about && about.length > 255) {
      return err(res, 400, "About must be at most 255 characters.");
    }

    // Prefer authenticated user as creator if available
    const effectiveCreatorId = creatorId ? parseInt(creatorId) : null;

    // If creatorId provided, ensure user exists
    if (effectiveCreatorId) {
      const user = await prisma.user.findUnique({
        where: { id: effectiveCreatorId },
      });
      if (!user) return err(res, 400, "Creator user not found.");
    }

    // Create Company
    const Company = await prisma.Company.create({
      data: {
        name: name.trim(),
        about: about ?? null,
        creatorId: effectiveCreatorId ?? null,
      },
    });

    return res.status(201).json({ success: true, data: Company });
  } catch (e) {
    // Handle unique constraint violation (duplicate name)
    if (
      e.code === "P2002" &&
      e.meta &&
      e.meta.target &&
      e.meta.target.includes("name")
    ) {
      return err(res, 409, "Company name already exists.");
    }
    console.error("createCompany error:", e);
    return err(res, 500, "Failed to create Company.");
  }
};

// GET all Companys (optionally filter by creator)
const getCompanys = async (req, res) => {
  try {
    const { creatorId } = req.body;
    const where = {};
    console.log("creatorIdcreatorId", creatorId);

    if (creatorId) {
      const id = parseInt(creatorId);
      if (Number.isNaN(id)) return err(res, 400, "creatorId must be a number");
      where.creatorId = id;
    } else {
      return err(res, 500, "Creator Id should be sent");
    }

    const Companys = await prisma.Company.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ success: true, data: Companys });
  } catch (e) {
    console.error("getCompanys error:", e);
    return err(res, 500, "Failed to fetch Companys.");
  }
};

// GET single Company by id (includes projects)
const getCompany = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (Number.isNaN(id)) return err(res, 400, "Invalid Company id.");

    const Company = await prisma.Company.findUnique({
      where: { id },
    });

    if (!Company) return err(res, 404, "Company not found.");

    return res.status(200).json({ success: true, data: Company });
  } catch (e) {
    console.error("getCompany error:", e);
    return err(res, 500, "Failed to fetch Company.");
  }
};

// UPDATE Company
const updateCompany = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (Number.isNaN(id)) return err(res, 400, "Invalid Company id.");

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

    // Ensure Company exists
    const existing = await prisma.Company.findUnique({ where: { id } });
    if (!existing) return err(res, 404, "Company not found.");

    const updated = await prisma.Company.update({
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
      return err(res, 409, "Company name already exists.");
    }
    console.error("updateCompany error:", e);
    return err(res, 500, "Failed to update Company.");
  }
};

// DELETE Company
// Default safety: disallow deleting if projects exist. If you prefer cascade, adjust logic.
const deleteCompany = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (Number.isNaN(id)) return err(res, 400, "Invalid Company id.");

    const Company = await prisma.Company.findUnique({
      where: { id },
      include: { projects: true },
    });
    if (!Company) return err(res, 404, "Company not found.");

    if (Company.projects && Company.projects.length > 0) {
      return err(
        res,
        400,
        "Company has projects. Delete or detach projects before deleting the Company."
      );
    }

    await prisma.Company.delete({ where: { id } });
    return res
      .status(200)
      .json({ success: true, data: `Company ${id} deleted` });
  } catch (e) {
    console.error("deleteCompany error:", e);
    // If DB refuses if there are dependent rows not caught above, return 409
    if (e.code === "P2003") {
      return err(
        res,
        409,
        "Company has dependent records and cannot be deleted."
      );
    }
    return err(res, 500, "Failed to delete Company.");
  }
};

export { createCompany, getCompanys, getCompany, updateCompany, deleteCompany };
