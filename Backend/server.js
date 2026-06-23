import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import connectDB from "./config/db.js";
import cors from "cors";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const port = 3000;

app.get("/", (req, res) => {
  res.send("DesignFlow Webapp Working");
});

app.use("/api/auth", authRoutes);
app.listen(port, async () => {
  await connectDB();
  console.log(`Server is running on port ${port}`);
});
