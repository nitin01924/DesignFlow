import multer from "multer";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_THUMBNAIL_SIZE = 3 * 1024 * 1024;

const createImageUpload = (fileSize) => multer({
  // Memory storage avoids writing temporary user files to the application server.
  storage: multer.memoryStorage(),
  limits: {
    fileSize,
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

const projectImageUpload = createImageUpload(MAX_IMAGE_SIZE);
const thumbnailUpload = createImageUpload(MAX_THUMBNAIL_SIZE);

const receiveSingleImage = (upload, fieldName, sizeMessage) =>
  (req, res, next) => {
    upload.single(fieldName)(req, res, (error) => {
      if (!error) {
        next();
        return;
      }

      error.statusCode = 400;

      if (error.code === "LIMIT_FILE_SIZE") {
        error.message = sizeMessage;
      } else if (
        error.code === "LIMIT_FILE_COUNT" ||
        error.code === "LIMIT_UNEXPECTED_FILE"
      ) {
        error.message = "Only one image can be uploaded";
      }

      next(error);
    });
  };

export const uploadProjectImage = receiveSingleImage(
  projectImageUpload,
  "image",
  "Image must be 10 MB or smaller",
);

export const uploadProjectThumbnail = receiveSingleImage(
  thumbnailUpload,
  "thumbnail",
  "Thumbnail must be 3 MB or smaller",
);
