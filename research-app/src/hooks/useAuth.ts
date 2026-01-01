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

      // Diagnostic: Capture raw response body
      const rawBody = await res.text();
      let data;
      try {
        data = JSON.parse(rawBody);
      } catch {
        // Not valid JSON - return diagnostic with status and raw body
        return {
          success: false,
          error: `SERVER ${res.status}: ${rawBody}`,
        };
      }

      if (data.success) {
        setIsAuthenticated(true);
        return { success: true };
      }

      // Auth logic failure - server responded with JSON but success=false
      return {
        success: false,
        error: `SERVER ${res.status}: ${rawBody}`,
      };
    } catch (err) {
      // Fetch failed before reaching server
      const errorMessage = err instanceof Error ? err.message : String(err);
      return { success: false, error: `FETCH ERROR: ${errorMessage}` };
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
