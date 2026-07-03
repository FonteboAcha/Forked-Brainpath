import axios from "axios";

const BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// Plain instance — no interceptors. Used for auth calls that should
// never trigger the silent-refresh loop (refresh, logout).
export const plainAxios = axios.create({
  baseURL: BASE,
  withCredentials: true,
});

// Main instance — has interceptors for all other API calls.
const api = axios.create({
  baseURL: BASE,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const { data } = await plainAxios.post("/auth/refresh");
        sessionStorage.setItem("accessToken", data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        sessionStorage.removeItem("accessToken");
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

export default api;