import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    thumbnail: {
      type: String,
      trim: true,
      default: "",
    },
    thumbnailPublicId: {
      type: String,
      trim: true,
      default: "",
    },
    canvasImage: {
      type: String,
      trim: true,
    },
    canvasData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    canvasWidth: {
      type: Number,
      min: 1,
    },
    canvasHeight: {
      type: Number,
      min: 1,
    },
  },
  {
    timestamps: true,
  },
);

const Project = mongoose.model("Project", projectSchema);

export default Project;
