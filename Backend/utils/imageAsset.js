import path from "node:path";
import { getImageThumbnailUrl } from "../config/cloudinary.js";

const cleanFilename = (filename) =>
  path.basename(String(filename || "uploaded-image")).trim().slice(0, 255) ||
  "uploaded-image";

const cleanAssetName = (filename) => {
  const extension = path.extname(filename);
  return path.basename(filename, extension).trim().slice(0, 180) || "Image";
};

export const createImageAssetData = ({ owner, file, uploadResult }) => {
  const originalFilename = cleanFilename(file.originalname);

  return {
    owner,
    name: cleanAssetName(originalFilename),
    originalFilename,
    publicId: uploadResult.public_id,
    secureUrl: uploadResult.secure_url,
    mimeType: file.mimetype,
    format: uploadResult.format,
    width: uploadResult.width,
    height: uploadResult.height,
    bytes: uploadResult.bytes || file.size || 0,
  };
};

export const serializeImageAsset = (asset) => ({
  id: String(asset._id),
  name: asset.name,
  originalFilename: asset.originalFilename,
  secureUrl: asset.secureUrl,
  thumbnailUrl: getImageThumbnailUrl(asset.publicId),
  mimeType: asset.mimeType,
  format: asset.format,
  width: asset.width,
  height: asset.height,
  bytes: asset.bytes,
  createdAt: asset.createdAt,
});
