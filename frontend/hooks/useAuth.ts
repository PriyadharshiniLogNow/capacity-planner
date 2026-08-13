"use client";

import {
  clearAuth,
  getStoredToken,
  getStoredUser,
  subscribeAuth,
} from "@/lib/auth/storage";
import type { AuthenticatedUser } from "@/types/auth.types";
import { useRouter } from "next/navigation";
import { useCallback, useSyncExternalStore } from "react";

export function useAuth() {
  const router = useRouter();
  const user = useSyncExternalStore(
    subscribeAuth,
    getStoredUser,
    (): AuthenticatedUser | null => null,
  );
  const token = useSyncExternalStore(
    subscribeAuth,
    getStoredToken,
    (): string | null => null,
  );

  const signOut = useCallback(() => {
    clearAuth();
    router.replace("/login");
  }, [router]);

  return {
    user,
    token,
    isAuthenticated: Boolean(token),
    signOut,
  };
}
