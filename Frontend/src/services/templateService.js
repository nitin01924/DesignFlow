import { apiRequest } from "../utils/api";

export const getTemplates = async () => {
  const result = await apiRequest("/api/templates");
  return {
    categories: result.categories || [],
    templates: result.templates || [],
  };
};

export const createProjectFromTemplate = async (templateId, title) => {
  const result = await apiRequest(`/api/templates/${templateId}/projects`, {
    method: "POST",
    body: JSON.stringify(title ? { title } : {}),
  });
  return result.project;
};
