import { apiRequest } from "../utils/api";

export const getProjects = async () => {
  const result = await apiRequest("/api/projects");
  return result.projects || [];
};

export const getProject = async (projectId) => {
  const result = await apiRequest(`/api/projects/${projectId}`);
  return result.project;
};

export const createProject = async (title) => {
  const result = await apiRequest("/api/projects", {
    method: "POST",
    body: JSON.stringify({ title }),
  });

  return result.project;
};

export const renameProject = async (projectId, title) => {
  const result = await apiRequest(`/api/projects/${projectId}`, {
    method: "PATCH",
    body: JSON.stringify({ title }),
  });

  return result.project;
};

export const deleteProject = async (projectId) => {
  return apiRequest(`/api/projects/${projectId}`, {
    method: "DELETE",
  });
};

export const uploadProjectImage = async (projectId, image) => {
  const formData = new FormData();
  formData.append("image", image);

  const result = await apiRequest(`/api/projects/${projectId}/upload`, {
    method: "POST",
    body: formData,
  });

  return result.project;
};

export const saveProjectCanvas = async (projectId, canvasData, dimensions) => {
  const result = await apiRequest(`/api/projects/${projectId}/canvas`, {
    method: "PUT",
    body: JSON.stringify({
      canvasData,
      canvasWidth: dimensions.width,
      canvasHeight: dimensions.height,
    }),
  });

  return result.project;
};
