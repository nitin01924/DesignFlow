import express from "express";
import {
  createProject,
  clearProjectThumbnail,
  deleteProject,
  getProjectById,
  getProjects,
  renameProject,
  saveProjectCanvas,
  uploadProjectImage,
  uploadProjectThumbnail,
} from "../controllers/projectController.js";
import { protect } from "../middleware/authMiddleware.js";
import {
  uploadProjectImage as receiveProjectImage,
  uploadProjectThumbnail as receiveProjectThumbnail,
} from "../middleware/uploadMiddleware.js";

const router = express.Router();

// .use(protect) will be run each time when the project routes will be use to protect the api.
router.use(protect);

router.route("/").get(getProjects).post(createProject);
router.post("/:id/upload", receiveProjectImage, uploadProjectImage);
router
  .route("/:id/thumbnail")
  .post(receiveProjectThumbnail, uploadProjectThumbnail)
  .delete(clearProjectThumbnail);
router.put("/:id/canvas", saveProjectCanvas);
router
  .route("/:id")
  .get(getProjectById)
  .delete(deleteProject)
  .patch(renameProject);

export default router;
