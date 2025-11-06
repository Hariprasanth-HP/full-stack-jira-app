const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const createFeature = async (req, res) => {
  try {
    const {  summary, description, priority, assignee, dueDate } =
      req.body;

    await prisma.features.create({
      data: {
        type:'feature',
        summary,
        description,
        priority,
        assignee,
        dueDate,
        createdAt: new Date().toISOString(),
      },
    });
    res.status(201).json("feature Created"); // Changed to 201 for resource creation
  } catch (e) {
    console.log("errorr when creating feature", e);

    res.status(500).json({ error: e });
  }
};
const getFeatures = async (_, res) => {
  try {
    const allfeatures = await prisma.features.findMany({
      orderBy: {
        createdAt: "desc", // Optional: orders by due date descending
      },
    });
    res.status(200).json(allfeatures); // Changed to 201 for resource creation
  } catch (e) {
    console.log("errorr when getting feature", e);
    res.status(500).json({ error: e });
  }
};

const getFeature = async (req, res) => {
  try {
    const { id } = req.params;
    const feature = await prisma.features.findUnique({
      where: { id: parseInt(id) },
    });
    if (!feature) res.status(400).json("No feature found");
    res.status(200).json(feature); // Changed to 201 for resource creation
  } catch (e) {
    console.log("errorr when getting feature", e);
    res.status(500).json({ error: e });
  }
};
const updateFeature = async (req, res) => {
  try {const {  id } =
      req.params;
    const {  summary, description, priority, assignee, dueDate} =
      req.body;
    await prisma.features.update({
      where: { id:parseInt(id) },
      data: {
        type:'feature',
        summary,
        description,
        priority,
        assignee,
        dueDate,
      },
    });
    res.status(201).json("feature updated"); // Changed to 201 for resource creation
  } catch (e) {
    console.log("errorr when getting feature", e);
    res.status(500).json({ error: e });
  }
};
const deleteFeature = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.features.delete({
      where: { id: parseInt(id) },
    });
    res.status(201).json("feature Deleted"); // Changed to 201 for resource creation
  } catch (e) {
    console.log("errorr when getting feature", e);
    res.status(500).json({ error: e });
  }
};

module.exports = {
  createFeature,
  deleteFeature,
  getFeature,
  getFeatures,
  updateFeature,
};
