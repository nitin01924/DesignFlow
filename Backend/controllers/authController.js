import User from "../models/User.js";
import * as crypto from "crypto";

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
    });

    res.status(201).json({
      success: true,
      message: "User has been Registered",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "something goes wrong with backend",
    });
  }
};

export const loginUser = async (req, res) => {};
