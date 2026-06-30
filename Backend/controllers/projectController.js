import Project from "../models/Project.js";
import asyncHandler from "../middleware/asyncHandler.js";
import mongoose from "mongoose";

const isValidProjectId = (id) => mongoose.Types.ObjectId.isValid(id);

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

export const getProjects = asyncHandler(async (req, res) => {
  const projects = await Project.find({ owner: req.user._id }).sort({
    updatedAt: -1,
  });

  res.status(200).json({
    success: true,
    projects,
  });
});

export const getProjectById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidProjectId(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid project id",
    });
  }

  const project = await Project.findOne({
    _id: id,
    owner: req.user._id,
  });

  if (!project) {
    return res.status(404).json({
      success: false,
      message: "Project not found",
    });
  }

  res.status(200).json({
    success: true,
    project,
  });
});

export const deleteProject = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidProjectId(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid project id",
    });
  }

  const project = await Project.findOneAndDelete({
    _id: id,
    owner: req.user._id,
  });

  if (!project) {
    return res.status(404).json({
      success: false,
      message: "Project not found",
    });
  }

  res.status(200).json({
    success: true,
    message: "Project deleted successfully",
  });
});

export const renameProject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title } = req.body;

  if (!isValidProjectId(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid project id",
    });
  }

  if (!title || !title.trim()) {
    return res.status(400).json({
      success: false,
      message: "Project title is required",
    });
  }

  const project = await Project.findOneAndUpdate(
    {
      _id: id,
      owner: req.user._id,
    },
    { title: title.trim() },
    { new: true, runValidators: true },
  );

  if (!project) {
    return res.status(404).json({
      success: false,
      message: "Project not found",
    });
  }

  res.status(200).json({
    success: true,
    message: "Project renamed successfully",
    project,
  });
});
