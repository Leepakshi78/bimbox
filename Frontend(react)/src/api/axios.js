import axios from "axios";
import { getToken, removeToken } from "../utils/token";

const API = axios.create({
  baseURL: "http://localhost:6001/api/user",
});

// Attach token on every request
API.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle global errors once (no need to repeat in every page)
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;

    // Invalid/expired token -> logout + go login
    if (status === 401) {
      removeToken();
      window.location.href = "/login";
      return Promise.reject(error);
    }

    // Blocked user (suspended/deactivated) -> go blocked page
    if (status === 403) {
      // If backend sends a message, pass it via query param
      const msg =
        error?.response?.data?.message ||
        "Account access blocked. Contact admin.";
      window.location.href = `/blocked?msg=${encodeURIComponent(msg)}`;
      return Promise.reject(error);
    }

    // Maintenance mode -> go maintenance page
    if (status === 503) {
      const msg =
        error?.response?.data?.message ||
        "System under maintenance. Try again later.";
      window.location.href = `/maintenance?msg=${encodeURIComponent(msg)}`;
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default API;