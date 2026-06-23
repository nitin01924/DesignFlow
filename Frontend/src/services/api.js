import { apiRequest } from "../utils/api";

//CONNECT REGISTERUSER frontend to backend
export const registerUser = async (data) => {
  const result = await apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });

  return result;
};
