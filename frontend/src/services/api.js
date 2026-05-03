import axios from "axios";

// Create axios instance with default config
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add interceptor to include JWT token in requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("studyvibe_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Add response interceptor to handle token expiry
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || "";
    const isAuthEntryPoint =
      requestUrl.includes("/api/auth/login") ||
      requestUrl.includes("/api/auth/signup");

    if (error.response?.status === 401 && !isAuthEntryPoint) {
      // Token expired or invalid
      localStorage.removeItem("studyvibe_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

// Health check to see if backend is up
// Useful for showing connection status in UI
export const checkBackendStatus = async () => {
  try {
    const response = await api.get("/");
    return response.data;
  } catch (error) {
    console.error("Error checking backend status:", error);
    throw error;
  }
};
