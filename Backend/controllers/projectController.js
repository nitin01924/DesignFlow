import Project from "../models/Project.js";
import asyncHandler from "../middleware/asyncHandler.js";

export const createProject = asyncHandler(async (req, res) => {
  const { title } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({
      success: false,
      message: "Project title is required",
    });
  }

  // The owner must come from the authenticated user attached by protect middleware.
  // Reading owner from req.body would let clients create projects for another user.
  const project = await Project.create({
    title: title.trim(),
    owner: req.user._id,
  });

  res.status(201).json({
    success: true,
    message: "Project created successfully",
    project,
  });
});
