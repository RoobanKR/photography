"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, clearSession, getStoredUser, getToken, saveSession, SessionUser } from "./api";

type AuthStatus = "checking" | "authenticated" | "offline";

interface AuthContextValue {
  user: SessionUser | null;
  status: AuthStatus;
  retry: () => void;
  logout: () => Promise<void>;
  // True when the signed-in user has every listed permission
  can: (...permissions: string[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("checking");

  const verify = useCallback(async () => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    // Show the cached user immediately while the server confirms the token
    setUser(getStoredUser());
    setStatus("checking");

    try {
      const data = await api<{ user: SessionUser }>("/auth/me");
      saveSession(token, data.user);
      setUser(data.user);
      setStatus("authenticated");
    } catch (error) {
      // 401 is handled inside api() (session cleared + redirect).
      // Anything else means the server is unreachable: keep the session and let the user retry.
      if (error instanceof ApiError && error.status !== 401) setStatus("offline");
    }
  }, [router]);

  useEffect(() => {
    verify();
  }, [verify]);

  const logout = useCallback(async () => {
    // Remove the token on the server too, so it can't be reused
    await api("/auth/logout", { method: "POST" }).catch(() => {});
    clearSession();
    router.replace("/login");
  }, [router]);

  const can = useCallback(
    (...permissions: string[]) => permissions.every((p) => user?.permissions?.includes(p)),
    [user]
  );

  return (
    <AuthContext.Provider value={{ user, status, retry: verify, logout, can }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
