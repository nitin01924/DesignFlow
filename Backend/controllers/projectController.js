import Project from "../models/Project.js";
import asyncHandler from "../middleware/asyncHandler.js";
import mongoose from "mongoose";
import {
  deleteImageByPublicId,
  uploadImageBuffer,
  uploadThumbnailBuffer,
} from "../config/cloudinary.js";

const isValidProjectId = (id) => mongoose.Types.ObjectId.isValid(id);
//
// !!==================== Create-Project ================!!

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
//
// !!==================== Get-All-projects ================!!

export const getProjects = asyncHandler(async (req, res) => {
  const projects = await Project.find({ owner: req.user._id }).sort({
    updatedAt: -1,
  });

  res.status(200).json({
    success: true,
    projects,
  });
});

//
// !!==================== Get-specific-project ================!!

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
//
// !!==================== Delete-project ================!!

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

  if (project.thumbnailPublicId) {
    deleteImageByPublicId(project.thumbnailPublicId).catch((error) => {
      console.warn("Unable to remove deleted project thumbnail", error);
    });
  }

  res.status(200).json({
    success: true,
    message: "Project deleted successfully",
  });
});
//
// !!==================== Rename-project ================!!

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

//
// !!==================== Save-project-canvas ================!!

export const saveProjectCanvas = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { canvasData, canvasWidth, canvasHeight } = req.body;

  if (!isValidProjectId(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid project id",
    });
  }

  if (
    !canvasData ||
    typeof canvasData !== "object" ||
    Array.isArray(canvasData) ||
    !Array.isArray(canvasData.objects)
  ) {
    return res.status(400).json({
      success: false,
      message: "Valid Fabric canvas data is required",
    });
  }

  const width = Number(canvasWidth);
  const height = Number(canvasHeight);
  if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) {
    return res.status(400).json({
      success: false,
      message: "Valid canvas dimensions are required",
    });
  }

  const project = await Project.findOneAndUpdate(
    { _id: id, owner: req.user._id },
    {
      canvasData,
      canvasWidth: width,
      canvasHeight: height,
    },
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
    message: "Project saved successfully",
    project,
  });
});

//
// !!==================== Upload-project-image ================!!

export const uploadProjectImage = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidProjectId(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid project id",
    });
  }

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "An image is required",
    });
  }

  // Querying with both fields prevents users from uploading to projects they do not own.
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

  const uploadResult = await uploadImageBuffer(req.file.buffer);
  project.canvasImage = uploadResult.secure_url;
  await project.save();

  res.status(200).json({
    success: true,
    message: "Image uploaded successfully",
    project,
  });
});

//
// !!==================== Project-thumbnail ================!!

export const uploadProjectThumbnail = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidProjectId(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid project id",
    });
  }

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "A thumbnail image is required",
    });
  }

  // Resolve ownership before uploading. This prevents an authenticated user
  // from writing previews for a project they do not own.
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

  // A stable Cloudinary public ID replaces the prior preview on every Save,
  // preventing one orphaned image per project revision.
  const uploadResult = await uploadThumbnailBuffer(req.file.buffer, project._id);
  project.thumbnail = uploadResult.secure_url;
  project.thumbnailPublicId = uploadResult.public_id;
  await project.save();

  res.status(200).json({
    success: true,
    message: "Project thumbnail updated successfully",
    project,
  });
});

export const clearProjectThumbnail = asyncHandler(async (req, res) => {
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

  const previousPublicId = project.thumbnailPublicId;
  project.thumbnail = "";
  project.thumbnailPublicId = "";
  await project.save();

  if (previousPublicId) {
    deleteImageByPublicId(previousPublicId).catch((error) => {
      console.warn("Unable to remove cleared project thumbnail", error);
    });
  }

  res.status(200).json({
    success: true,
    message: "Project thumbnail cleared successfully",
    project,
  });
});
