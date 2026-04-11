import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api, { setAuthToken, setRefreshToken, getRefreshToken } from "@/lib/api";

/**
 * Shared hook for logout logic.
 * Revokes the refresh token server-side, clears local tokens, and navigates to login.
 */
export const useLogout = () => {
  const navigate = useNavigate();

  return useCallback(async () => {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        await api.post("/user/logout", { refresh_token: refreshToken });
      } catch {
        // Best-effort — still log out locally even if the server call fails
      }
    }
    setAuthToken(null);
    setRefreshToken(null);
    navigate("/login");
  }, [navigate]);
};
