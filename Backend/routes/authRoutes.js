import express from "express";
import {
  registerUser,
  forgotPassword,
  loginUser,
  resendVerificationEmail,
  resetPassword,
  verifyEmail,
} from "../controllers/authController.js";

const router = express.Router();

router.post("/register", registerUser);

router.post("/login", loginUser);

router.get("/verify-email", verifyEmail);

router.post("/resend-verification", resendVerificationEmail);

router.post("/forgot-password", forgotPassword);

router.post("/reset-password", resetPassword);

export default router;
