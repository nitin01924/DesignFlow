import { apiRequest } from "../utils/api";

export const getProjects = async () => {
  const result = await apiRequest("/api/projects");
  return result.projects || [];
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
