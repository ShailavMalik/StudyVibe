import { useContext } from "react";
import { AuthContext } from "../contexts/authContext";
import { api } from "../services/api";

// Hook for logging out
// Cleans up tokens and auth state
const useLogout = () => {
  const { logout: contextLogout } = useContext(AuthContext);

  const logout = async () => {
    try {
      const token = localStorage.getItem("studyvibe_token");

      // Call logout endpoint if token exists
      if (token) {
        try {
          await api.post(
            "/api/auth/logout",
            {},
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );
        } catch (error) {
          // Continue logout even if server call fails
          console.error("Error calling logout endpoint:", error);
        }
      }

      // Clean up stored tokens and demo flags
      localStorage.removeItem("studyvibe_token");
      localStorage.removeItem("studyvibe_demo");

      // Clear user state from context
      contextLogout();

      console.log("User logged out successfully");
    } catch (error) {
      console.error("Error logging out:", error);
      // Clear state anyway
      localStorage.removeItem("studyvibe_token");
      localStorage.removeItem("studyvibe_demo");
      contextLogout();
    }
  };

  return { logout };
};

export default useLogout;
