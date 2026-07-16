import express from "express";
import {
  createProject,
  deleteProject,
  getProjectById,
  getProjects,
  renameProject,
  uploadProjectImage,
} from "../controllers/projectController.js";
import { protect } from "../middleware/authMiddleware.js";
import { uploadProjectImage as receiveProjectImage } from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.use(protect);

router.route("/").get(getProjects).post(createProject);
router.post("/:id/upload", receiveProjectImage, uploadProjectImage);
router
  .route("/:id")
  .get(getProjectById)
  .delete(deleteProject)
  .patch(renameProject);

export default router;
