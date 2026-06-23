const API_URL = import.meta.env.VITE_API_URL;

//
export const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
      ...options.headers,
    },
  });

  let data; // instead ( const data = await res.json(); )
  try {
    data = await res.json();
  } catch {
    data = {}; // Justincase: if backend sends HTML error.
  }

  if (res.status === 401 && token) {
    localStorage.removeItem("token");
    window.location.href = "/";
    throw new Error(data.message || "Session expired. Please log in again.");
  }

  if (!res.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
};
