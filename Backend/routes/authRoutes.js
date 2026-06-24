import express from "express";
import {
  registerUser,
  loginUser,
  resendVerificationEmail,
  verifyEmail,
} from "../controllers/authController.js";

const router = express.Router();

router.post("/register", registerUser);

router.post("/login", loginUser);

router.get("/verify-email", verifyEmail);

router.post("/resend-verification", resendVerificationEmail);

export default router;
