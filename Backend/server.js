import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import connectDB from "./config/db.js";
import cors from "cors";
import { errorHandler } from "./middleware/errorMiddleware.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const port = 3000;

app.get("/", (req, res) => {
  res.send("DesignFlow Webapp Working");
});

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use(errorHandler);

app.listen(port, async () => {
  await connectDB();
  console.log(`Server is running on port ${port}`);
});
