import { createContext, useContext, useEffect, useState } from "react";
import api, { plainAxios } from "../lib/axios.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Use plainAxios here — if there's no cookie this will 401 cleanly
    // without the interceptor triggering another refresh and looping.
    plainAxios.post("/auth/refresh")
      .then(({ data }) => {
        sessionStorage.setItem("accessToken", data.accessToken);
        return api.get("/auth/me");
      })
      .then(({ data }) => setUser(data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const { data } = await plainAxios.post("/auth/login", { email, password });
    sessionStorage.setItem("accessToken", data.accessToken);
    setUser(data.user);
    return data.user;
  }

  async function logout() {
    await plainAxios.post("/auth/logout");
    sessionStorage.removeItem("accessToken");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}