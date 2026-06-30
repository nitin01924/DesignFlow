import express from "express";
import {
  createProject,
  deleteProject,
  getProjectById,
  getProjects,
  renameProject,
} from "../controllers/projectController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.route("/").get(getProjects).post(createProject);
router
  .route("/:id")
  .get(getProjectById)
  .delete(deleteProject)
  .patch(renameProject);

export default router;
