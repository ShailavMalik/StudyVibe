import { useState, useContext } from "react";
import { api } from "../services/api";
import { AuthContext } from "../contexts/authContext";

// Custom hook for handling email/password login
// Returns a login function and loading state for the UI
const useLogin = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { setUser } = useContext(AuthContext);

  const login = async (username, password) => {
    // Quick validation before we hit the server
    const success = handleInputErrors(username, password);
    if (!success) {
      setError("Please enter your username and password.");
      return;
    }

    const normalizedUsername = username.trim().toLowerCase();
    const normalizedPassword = password.trim();

    setLoading(true);
    setError(null);

    try {
      // Call backend login endpoint
      const response = await api.post("/api/auth/login", {
        username: normalizedUsername,
        password: normalizedPassword,
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
      const errorMessage = getAuthErrorMessage(
        error,
        "Unable to log in right now. Please try again.",
      );
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
function handleInputErrors(username, password) {
  if (!username || !password) {
    return false;
  }

  return true;
}

function getAuthErrorMessage(error, fallbackMessage) {
  if (error?.code === "ERR_NETWORK" || !error?.response) {
    return "Connection issue. Please check your internet or server and try again.";
  }

  return error.response?.data?.error || fallbackMessage;
}
