import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { setAuthToken } from "@/lib/api";

/**
 * Shared hook for logout logic. Clears auth token and navigates to login.
 */
export const useLogout = () => {
  const navigate = useNavigate();

  return useCallback(() => {
    setAuthToken(null);
    navigate("/login");
  }, [navigate]);
};
