import User from "../models/User.js";
import * as crypto from "crypto";
import { sendVerificationEmail } from "../utils/SendEmail.js";

const createVerificationToken = () => crypto.randomBytes(32).toString("hex");
const createVerificationExpiry = () =>
  new Date(Date.now() + 24 * 60 * 60 * 1000);

export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Please fill all the fields",
      });
    }
    const normalizedEmail = email.toLowerCase().trim();

    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "User already exists.",
      });
    }

    const token = createVerificationToken();
    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      verificationToken: token,
      verificationTokenExpires: createVerificationExpiry(),
    });

    await sendVerificationEmail(user.email, token);

    res.status(201).json({
      success: true,
      message: "Check your email to verify account",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "something goes wrong with backend",
    });
  }
};

// !!==================== Login-User ====================!!

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "email and password are required",
    });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail }).select(
    "+password",
  );

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found. Please register first.",
    });
  }

  const isPasswordMatched = await user.matchPassword(password);

  if (!isPasswordMatched) {
    return res.status(401).json({
      success: false,
      message: "Invalid email or password",
    });
  }

  if (!user.isVerified) {
    return res.status(403).json({
      success: false,
      message: "Please verify your email before logging in.",
      code: "EMAIL_NOT_VERIFIED",
    });
  }

  res.status(200).json({
    success: true,
    message: "User has been logged-in",
    data: {
      name: user.name,
      id: user._id,
      email: user.email,
    },
  });
};

//
// !!==================== Verify_email================!!

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Verification token is required",
      });
    }

    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification link",
      });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;

    await user.save();

    res.json({ success: true, message: "Email verified successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to verify email",
    });
  }
};

export const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found. Please register first.",
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified.",
      });
    }

    const token = createVerificationToken();
    user.verificationToken = token;
    user.verificationTokenExpires = createVerificationExpiry();

    await user.save();
    await sendVerificationEmail(user.email, token);

    res.json({
      success: true,
      message: "Verification email sent. Please check your inbox.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to resend verification email",
    });
  }
};
