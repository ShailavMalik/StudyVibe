import { useState, useContext } from "react";
import { api } from "../services/api";
import { AuthContext } from "../contexts/authContext";

const useSignup = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { setUser } = useContext(AuthContext);

  const signup = async ({ email, password, confirmPassword, displayName }) => {
    const success = handleInputErrors(email, password, confirmPassword);
    if (!success) {
      setError("Please check your inputs");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.post("/api/auth/signup", {
        email,
        password,
        confirmPassword,
        displayName: displayName || email.split("@")[0],
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
      const errorMessage =
        error.response?.data?.error || "Signup failed. Please try again.";
      setError(errorMessage);
      console.error("Error signing up:", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return { signup, loading, error };
};

export default useSignup;

function handleInputErrors(email, password, confirmPassword) {
  if (password !== confirmPassword) {
    window.alert("Passwords do not match");
    return false;
  }
  if (!email || !password) {
    window.alert("Please fill in all fields");
    return false;
  }

  return true;
}
