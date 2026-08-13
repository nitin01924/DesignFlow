import Project from "../models/Project.js";
import asyncHandler from "../middleware/asyncHandler.js";
import {
  getTemplateById,
  getTemplateCatalog,
  serializeTemplateMetadata,
  TEMPLATE_CATEGORIES,
} from "../data/templateCatalog.js";

const cloneCanvasData = (canvasData) => structuredClone(canvasData);

export const getTemplates = asyncHandler(async (req, res) => {
  const search = String(req.query.search || "").trim().toLowerCase().slice(0, 100);
  const category = String(req.query.category || "").trim().toLowerCase();
  const templates = getTemplateCatalog().filter((template) => {
    const matchesSearch =
      !search ||
      template.name.toLowerCase().includes(search) ||
      template.category.toLowerCase().includes(search);
    const matchesCategory =
      !category ||
      category === "all" ||
      template.category.toLowerCase() === category;
    return matchesSearch && matchesCategory;
  });

  res.status(200).json({
    success: true,
    categories: TEMPLATE_CATEGORIES,
    templates: templates.map(serializeTemplateMetadata),
  });
});

export const createProjectFromTemplate = asyncHandler(async (req, res) => {
  const template = getTemplateById(req.params.templateId);
  if (!template) {
    return res.status(404).json({
      success: false,
      message: "Template not found",
    });
  }

  const requestedTitle = String(req.body?.title || "").trim();
  if (requestedTitle.length > 100) {
    return res.status(400).json({
      success: false,
      message: "Project title cannot exceed 100 characters",
    });
  }

  // Clone the immutable catalog document into a new user-owned project. The
  // template remains public/read-only and can never be mutated by editor saves.
  const project = await Project.create({
    title: requestedTitle || template.name,
    owner: req.user._id,
    canvasData: cloneCanvasData(template.canvasData),
    canvasWidth: template.canvasWidth,
    canvasHeight: template.canvasHeight,
    // The catalog preview provides an immediate Dashboard thumbnail. The normal
    // Save flow replaces it with the existing Cloudinary canvas thumbnail.
    thumbnail: template.preview,
  });

  res.status(201).json({
    success: true,
    message: "Project created from template",
    project,
  });
});
