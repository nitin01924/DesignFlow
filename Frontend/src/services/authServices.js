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

export const verifyEmail = async (token) => {
  return await apiRequest(
    `/api/auth/verify-email?token=${encodeURIComponent(token)}`,
  );
};

export const resendVerification = async (email) => {
  return await apiRequest("/api/auth/resend-verification", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
};

export const forgotPassword = async (email) => {
  return await apiRequest("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
};

export const resetPassword = async (token, password) => {
  return await apiRequest(
    `/api/auth/reset-password?token=${encodeURIComponent(token)}`,
    {
      method: "POST",
      body: JSON.stringify({ password }),
    },
  );
};
