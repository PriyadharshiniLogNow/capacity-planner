import type { AuthenticatedUser } from "@/types/auth.types";

export const AUTH_TOKEN_KEY = "lognow.auth.token";
export const AUTH_USER_KEY = "lognow.auth.user";

let cachedUserRaw: string | null | undefined;
let cachedUser: AuthenticatedUser | null = null;

function canUseStorage() {
  return typeof window !== "undefined";
}

export function getStoredToken(): string | null {
  if (!canUseStorage()) {
    return null;
  }

  return (
    window.localStorage.getItem(AUTH_TOKEN_KEY) ??
    window.sessionStorage.getItem(AUTH_TOKEN_KEY)
  );
}

export function getStoredUser(): AuthenticatedUser | null {
  if (!canUseStorage()) {
    return null;
  }

  const raw =
    window.localStorage.getItem(AUTH_USER_KEY) ??
    window.sessionStorage.getItem(AUTH_USER_KEY);

  if (raw === cachedUserRaw) {
    return cachedUser;
  }

  cachedUserRaw = raw;

  if (!raw) {
    cachedUser = null;
    return null;
  }

  try {
    const user = JSON.parse(raw) as AuthenticatedUser;
    if (
      typeof user?.id === "string" &&
      typeof user?.email === "string" &&
      typeof user?.role === "string"
    ) {
      cachedUser = user;
      return user;
    }
  } catch {
    cachedUser = null;
    return null;
  }

  cachedUser = null;
  return null;
}

const AUTH_CHANGED_EVENT = "lognow-auth-changed";

function notifyAuthChanged() {
  if (!canUseStorage()) {
    return;
  }

  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

export function subscribeAuth(callback: () => void) {
  if (!canUseStorage()) {
    return () => undefined;
  }

  window.addEventListener("storage", callback);
  window.addEventListener(AUTH_CHANGED_EVENT, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(AUTH_CHANGED_EVENT, callback);
  };
}

export function persistAuth(token: string, user: AuthenticatedUser) {
  if (!canUseStorage()) {
    return;
  }

  window.sessionStorage.removeItem(AUTH_TOKEN_KEY);
  window.sessionStorage.removeItem(AUTH_USER_KEY);
  window.localStorage.setItem(AUTH_TOKEN_KEY, token);
  window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  cachedUserRaw = undefined;
  cachedUser = null;
  notifyAuthChanged();
}

export function clearAuth() {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(AUTH_TOKEN_KEY);
  window.localStorage.removeItem(AUTH_USER_KEY);
  window.sessionStorage.removeItem(AUTH_TOKEN_KEY);
  window.sessionStorage.removeItem(AUTH_USER_KEY);
  cachedUserRaw = undefined;
  cachedUser = null;
  notifyAuthChanged();
}
