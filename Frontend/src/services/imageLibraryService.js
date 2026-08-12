import { apiRequest } from "../utils/api";
import { validateImageFile } from "../components/editor/images/imageValidation.js";

export const getImageAssets = async ({ before, limit = 60, search } = {}) => {
  const query = new URLSearchParams({ limit: String(limit) });
  if (before) query.set("before", before);
  if (search) query.set("search", search);
  const result = await apiRequest(`/api/images?${query}`);
  return {
    assets: result.assets || [],
    pagination: result.pagination || { hasMore: false, nextCursor: null },
  };
};

// Both direct project uploads and library-only uploads use the existing
// protected project endpoint, Multer limits, and Cloudinary pipeline.
export const uploadImageAssetRequest = async (
  projectId,
  image,
  { libraryOnly = false } = {},
) => {
  validateImageFile(image);
  const formData = new FormData();
  formData.append("image", image);
  if (libraryOnly) formData.append("libraryOnly", "true");

  return apiRequest(`/api/projects/${projectId}/upload`, {
    method: "POST",
    body: formData,
  });
};

export const uploadImageAsset = async (projectId, image) => {
  const result = await uploadImageAssetRequest(projectId, image, {
    libraryOnly: true,
  });
  return result.asset;
};
