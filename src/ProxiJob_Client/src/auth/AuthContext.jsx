import { createContext, useState, useContext, useEffect } from "react";
import { getStoredUser, clearAuthSession, getStoredToken, checkAuthApi } from "../api/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const token = getStoredToken();
      if (token) {
        try {
          const profile = await checkAuthApi(token);
          setUser(profile);
        } catch (err) {
          console.log("Check auth failed, logging out:", err.message);
          clearAuthSession();
          setUser(null);
        }
      }
      setLoading(false);
    }
    checkAuth();
  }, []);

  const setCurrentUser = (newUser) => {
    setUser(newUser);
  };

  const logout = () => {
    clearAuthSession();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setCurrentUser, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth phải được dùng bên trong AuthProvider");
  }
  return context;
}

