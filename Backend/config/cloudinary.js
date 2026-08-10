import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { v2 as cloudinary } from "cloudinary";

const THUMBNAIL_UPLOAD_ATTEMPTS = 3;
const THUMBNAIL_RETRY_DELAY_MS = 250;
const RETRYABLE_CLOUDINARY_CODES = new Set([
  408,
  429,
  499,
  500,
  502,
  503,
  504,
]);

// Resolve the backend environment file from this module instead of process.cwd(),
// so credentials load whether the server starts inside Backend or from the repo root.
dotenv.config({
  path: fileURLToPath(new URL("../.env", import.meta.url)),
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const ensureCloudinaryConfiguration = () => {
  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    const error = new Error("Cloudinary configuration is missing");
    error.statusCode = 500;
    throw error;
  }
};

export const uploadImageBuffer = (buffer, options = {}) => {
  ensureCloudinaryConfiguration();

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "designflow/projects",
        resource_type: "image",
        ...options,
      },
      (error, result) => {
        if (error) {
          const uploadError = new Error("Unable to upload image");
          uploadError.statusCode = 502;
          uploadError.cause = error;
          reject(uploadError);
          return;
        }

        resolve(result);
      },
    );

    uploadStream.end(buffer);
  });
};

const isRetryableThumbnailUpload = (error) => {
  const statusCode = Number(error?.cause?.http_code || error?.statusCode);
  return !statusCode || RETRYABLE_CLOUDINARY_CODES.has(statusCode);
};

const waitForThumbnailRetry = (attempt) =>
  new Promise((resolve) => {
    setTimeout(resolve, THUMBNAIL_RETRY_DELAY_MS * attempt);
  });

export const uploadThumbnailBuffer = async (buffer, projectId) => {
  let lastError;

  // Preview uploads are derived and idempotent because every project uses one
  // stable public ID. Retrying only transient provider failures prevents a
  // momentary Cloudinary timeout from leaving a saved design without a card.
  for (let attempt = 1; attempt <= THUMBNAIL_UPLOAD_ATTEMPTS; attempt += 1) {
    try {
      return await uploadImageBuffer(buffer, {
        folder: "designflow/thumbnails",
        public_id: `project-${projectId}`,
        format: "webp",
        overwrite: true,
        invalidate: true,
        resource_type: "image",
      });
    } catch (error) {
      lastError = error;
      if (
        attempt === THUMBNAIL_UPLOAD_ATTEMPTS ||
        !isRetryableThumbnailUpload(error)
      ) {
        throw error;
      }
      await waitForThumbnailRetry(attempt);
    }
  }

  throw lastError;
};

export const deleteImageByPublicId = async (publicId) => {
  if (!publicId) return null;
  ensureCloudinaryConfiguration();
  return cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
    invalidate: true,
  });
};

export default cloudinary;
