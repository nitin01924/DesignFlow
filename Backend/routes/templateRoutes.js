import express from "express";
import {
  createProjectFromTemplate,
  getTemplates,
} from "../controllers/templateController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getTemplates);
router.post("/:templateId/projects", protect, createProjectFromTemplate);

export default router;
