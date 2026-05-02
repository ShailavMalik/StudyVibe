import { useState, useContext } from "react";
import { api } from "../services/api";
import { AuthContext } from "../contexts/authContext";

// Custom hook for handling email/password login
// Returns a login function and loading state for the UI
const useLogin = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { setUser } = useContext(AuthContext);

  const login = async (email, password) => {
    // Quick validation before we hit the server
    const success = handleInputErrors(email, password);
    if (!success) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Call backend login endpoint
      const response = await api.post("/api/auth/login", {
        email,
        password,
      });

      if (response.data.token && response.data.user) {
        // Save token to localStorage
        localStorage.setItem("studyvibe_token", response.data.token);

        // Update auth context
        setUser(response.data.user);

        console.log("User logged in:", response.data.user);
        return response.data;
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.error || "Login failed. Please try again.";
      setError(errorMessage);
      console.error("Error logging in:", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return { login, loading, error };
};

export default useLogin;

// Simple validation helper
function handleInputErrors(email, password) {
  if (!email || !password) {
    window.alert("Please fill in all fields");
    return false;
  }

  return true;
}
