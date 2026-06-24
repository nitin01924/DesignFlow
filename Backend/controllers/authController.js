import User from "../models/User.js";
import * as crypto from "crypto";
import { sendVerificationEmail } from "../utils/SendEmail.js";

export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Please fill all the fields",
      });
    }
    const normalizedEmail = email.toLowerCase();

    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        error: "User already exist.",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      verificationToken: token,
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

  const normalizedEmail = email.toLowerCase();
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
