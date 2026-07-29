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
// Fabric documents can contain rich object metadata; keep a bounded but practical
// request limit while images themselves continue to be stored by URL.
app.use(express.json({ limit: "5mb" }));

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
