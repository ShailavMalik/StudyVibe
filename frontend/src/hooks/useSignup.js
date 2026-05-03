import { useState, useContext } from "react";
import { api } from "../services/api";
import { AuthContext } from "../contexts/authContext";

const useSignup = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { setUser } = useContext(AuthContext);

  const signup = async ({ name, username, email, password }) => {
    const success = handleInputErrors(name, username, email, password);
    if (!success) {
      setError("Please fill in all required signup fields.");
      return;
    }

    const normalizedName = name.trim();
    const normalizedUsername = username.trim().toLowerCase();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    setLoading(true);
    setError(null);

    try {
      const response = await api.post("/api/auth/signup", {
        name: normalizedName,
        username: normalizedUsername,
        email: normalizedEmail,
        password: normalizedPassword,
      });

      if (response.data.token && response.data.user) {
        // Save token to localStorage
        localStorage.setItem("studyvibe_token", response.data.token);

        // Update auth context
        setUser(response.data.user);

        console.log("User signed up:", response.data.user);
        return response.data;
      }
    } catch (error) {
      const errorMessage = getAuthErrorMessage(
        error,
        "Unable to sign up right now. Please try again.",
      );
      setError(errorMessage);
      console.error("Error signing up:", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return { signup, loading, error };
};

export default useSignup;

function handleInputErrors(name, username, email, password) {
  if (!name || !username || !email || !password) {
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
