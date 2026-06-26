import express from "express";
import {
  registerUser,
  forgotPassword,
  getMe,
  loginUser,
  resendVerificationEmail,
  resetPassword,
  verifyEmail,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);

router.post("/login", loginUser);

router.get("/me", protect, getMe);

router.get("/verify-email", verifyEmail);

router.post("/resend-verification", resendVerificationEmail);

router.post("/forgot-password", forgotPassword);

router.post("/reset-password", resetPassword);

export default router;
