import React, { createContext, useEffect, useState } from "react";
import { api } from "../services/api";

// This context provides auth state to the whole app
// Components can use this to check if someone is logged in
export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper to create a fake "demo" user for people who want to try the app
  // without creating an account
  const createDemoUser = () => ({
    id: "demo-user",
    displayName: "Demo User",
    email: "demo@studyvibe.local",
    isAnonymous: true,
    demo: true,
  });

  // Check if user is already logged in on app load
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem("studyvibe_token");

      if (token) {
        try {
          // Verify token by fetching current user
          const response = await api.get("/api/auth/me", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.data.user) {
            setUser(response.data.user);
            localStorage.removeItem("studyvibe_demo");
          }
        } catch (error) {
          console.error("Failed to verify token:", error);
          localStorage.removeItem("studyvibe_token");

          // Check if in demo mode
          const isDemo = localStorage.getItem("studyvibe_demo") === "true";
          if (isDemo) {
            setUser(createDemoUser());
          } else {
            setUser(null);
          }
        }
      } else {
        // No token - check if in demo mode
        const isDemo = localStorage.getItem("studyvibe_demo") === "true";
        if (isDemo) {
          setUser(createDemoUser());
        } else {
          setUser(null);
        }
      }

      setLoading(false);
    };

    checkAuthStatus();
  }, []);

  // Function to put someone into demo mode
  // Called from the Login page when they click "Continue as Demo"
  const loginAsDemo = () => {
    localStorage.setItem("studyvibe_demo", "true");
    localStorage.removeItem("studyvibe_token");
    setUser(createDemoUser());
  };

  // Function to log out
  const logout = () => {
    localStorage.removeItem("studyvibe_token");
    localStorage.removeItem("studyvibe_demo");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, setUser, loginAsDemo, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
