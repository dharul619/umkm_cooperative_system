import { createContext, useState, useEffect } from "react";
import { authService } from "../../features/auth/services/authService";

export const AuthContext = createContext();

const decodeToken = (token) => {
  const base64Url = token.split(".")[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split("")
      .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join(""),
  );

  return JSON.parse(jsonPayload);
};

const resolveLandingPath = (roleName) => {
  if (roleName === "Jastip Coordinator") return "/jastip/dashboard";
  if (roleName === "Business Coordinator") return "/retail/master/categories";
  if (roleName === "System Administrator") return "/admin/dashboard";
  return "/dashboard";
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (token) {
      const parsedUser = userData ? JSON.parse(userData) : decodeToken(token);
      localStorage.setItem("user", JSON.stringify(parsedUser));
      setIsLoggedIn(true);
      setUser(parsedUser);
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await authService.login(username, password);
      const token = response.token;
      const userData = response.user || decodeToken(token);
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
      setIsLoggedIn(true);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const register = async (formData) => {
    try {
      const response = await authService.register(formData);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setIsLoggedIn(false);
  };

  const value = {
    user,
    isLoggedIn,
    loading,
    login,
    register,
    logout,
    resolveLandingPath,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
