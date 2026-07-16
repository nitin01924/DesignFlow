import multer from "multer";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

const upload = multer({
  // Memory storage avoids writing temporary user files to the application server.
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_IMAGE_SIZE,
    files: 1,
  },
  fileFilter: (req, file, callback) => {
    if (!file.mimetype.startsWith("image/")) {
      callback(new Error("Only image files are allowed"));
      return;
    }

    callback(null, true);
  },
});

export const uploadProjectImage = (req, res, next) => {
  upload.single("image")(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    error.statusCode = 400;

    if (error.code === "LIMIT_FILE_SIZE") {
      error.message = "Image must be 10 MB or smaller";
    } else if (
      error.code === "LIMIT_FILE_COUNT" ||
      error.code === "LIMIT_UNEXPECTED_FILE"
    ) {
      error.message = "Only one image can be uploaded";
    }

    next(error);
  });
};
