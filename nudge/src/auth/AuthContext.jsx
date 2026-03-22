import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  fetchCurrentUser,
  logoutApi,
  normalizeUserPayload,
  refreshSession,
} from "../api/authApi";
import {
  clearDisplayProfileOnly,
  clearSessionStorage,
  readDisplayProfile,
  writeDisplayProfile,
} from "./sessionKeys";
import { mergeTokensFromResponse } from "./tokenStorage";

/** @typedef {import("../api/authApi").AuthUser} AuthUser */

/** @typedef {'unauthenticated' | 'restoring' | 'authenticated'} AuthStatus */

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [status, setStatus] = useState("restoring");
  const [user, setUser] = useState(null);

  /** Cold load: refresh cookies, then load profile (optional GET /auth/me) or display cache. */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setStatus("restoring");
      try {
        await refreshSession();
        if (cancelled) {
          return;
        }
        let nextUser = null;
        try {
          nextUser = await fetchCurrentUser();
        } catch {
          nextUser = null;
        }
        if (!nextUser) {
          nextUser = readDisplayProfile();
        }
        const resolved = nextUser ?? {
          userId: "",
          username: null,
          email: null,
          firstName: null,
          lastName: null,
          phone: null,
          timezone: null,
          smsOptIn: false,
        };
        setUser(resolved);
        if (nextUser) {
          writeDisplayProfile(nextUser);
        }
        setStatus("authenticated");
      } catch {
        if (!cancelled) {
          clearSessionStorage();
          setUser(null);
          setStatus("unauthenticated");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * After POST /auth/login or /auth/register (cookies set by the browser).
   * @param {import("axios").AxiosResponse} [axiosResponse]
   */
  const establishSession = useCallback(async (axiosResponse) => {
    if (axiosResponse?.data) {
      mergeTokensFromResponse(axiosResponse.data);
    }
    let nextUser = axiosResponse
      ? normalizeUserPayload(axiosResponse.data)
      : null;
    if (!nextUser) {
      try {
        nextUser = await fetchCurrentUser();
      } catch {
        nextUser = null;
      }
    } else {
      // Login/register bodies are often minimal; GET /auth/me is the canonical profile.
      try {
        const fromMe = await fetchCurrentUser();
        if (fromMe) {
          nextUser = fromMe;
        }
      } catch {
        /* keep user from response */
      }
    }
    if (!nextUser) {
      clearDisplayProfileOnly();
    }
    const resolved = nextUser ?? {
      userId: "",
      username: null,
      email: null,
      firstName: null,
      lastName: null,
      phone: null,
      timezone: null,
      smsOptIn: false,
    };
    setUser(resolved);
    if (nextUser) {
      writeDisplayProfile(nextUser);
    }
    setStatus("authenticated");
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch {
      /* still clear local state */
    }
    clearSessionStorage();
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  /** Refetch profile from GET /auth/me and update state + display cache. */
  const refreshUser = useCallback(async () => {
    const next = await fetchCurrentUser();
    if (next) {
      setUser(next);
      writeDisplayProfile(next);
    }
    return next;
  }, []);

  const value = useMemo(
    () => ({
      status,
      user,
      isAuthenticated: status === "authenticated",
      isRestoring: status === "restoring",
      establishSession,
      logout,
      refreshUser,
    }),
    [status, user, establishSession, logout, refreshUser],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
