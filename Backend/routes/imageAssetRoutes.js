import express from "express";
import { getImageAssets } from "../controllers/imageAssetController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);
router.get("/", getImageAssets);

export default router;
