import { useState, useEffect, useCallback } from "react";

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check session via server (cookie sent automatically)
  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/.netlify/functions/auth-validate", {
        credentials: "same-origin",
      });
      const data = await res.json();
      setIsAuthenticated(data.valid === true);
    } catch {
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (
    username: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch("/.netlify/functions/auth-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (data.success) {
        setIsAuthenticated(true);
        return { success: true };
      }

      return { success: false, error: data.error || "Invalid credentials" };
    } catch {
      return { success: false, error: "Connection error" };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await fetch("/.netlify/functions/auth-logout", {
        method: "POST",
        credentials: "same-origin",
      });
    } catch {
      // Ignore errors
    }
    setIsAuthenticated(false);
  };

  return { isAuthenticated, isLoading, login, logout, checkAuth };
}
