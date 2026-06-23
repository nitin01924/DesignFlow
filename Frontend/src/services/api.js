import { apiRequest } from "../utils/api";

//CONNECT REGISTERUSER frontend to backend
export const registerUser = async (data) => {
  const result = await apiRequest("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });

  return result;
};

// LOGIN USER
export const loginUser = async (data) => {
  const result = await apiRequest("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });

  return result.data;
};