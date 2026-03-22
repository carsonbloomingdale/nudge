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
  fetchCurrentUserResilient,
  logoutApi,
  mergeAuthMeData,
  normalizeUserPayload,
  refreshSession,
} from "../api/authApi";
import { setSessionExpiredHandler } from "./authSessionBridge";
import {
  clearSessionStorage,
  readDisplayProfile,
  writeDisplayProfile,
} from "./sessionKeys";
import { SessionVerificationError } from "./sessionErrors";
import { mergeTokensFromResponse } from "./tokenStorage";

/** @typedef {import("../api/authApi").AuthUser} AuthUser */

/** @typedef {'unauthenticated' | 'restoring' | 'authenticated'} AuthStatus */

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [status, setStatus] = useState("restoring");
  const [user, setUser] = useState(null);

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

  useEffect(() => {
    setSessionExpiredHandler(() => {
      void logout();
    });
    return () => setSessionExpiredHandler(null);
  }, [logout]);

  /** Cold load: refresh cookies, then GET /auth/me. Stale display cache is not a substitute for a valid session. */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setStatus("restoring");
      try {
        await refreshSession();
        if (cancelled) {
          return;
        }
        const { user: verifiedUser, error: meErr } =
          await fetchCurrentUserResilient();
        const meRejected = Boolean(meErr);
        if (cancelled) {
          return;
        }
        if (verifiedUser) {
          writeDisplayProfile(verifiedUser);
          setUser(verifiedUser);
          setStatus("authenticated");
          return;
        }
        if (!meRejected) {
          const cached = readDisplayProfile();
          if (cached) {
            setUser(cached);
            setStatus("authenticated");
            return;
          }
        }
        clearSessionStorage();
        setUser(null);
        setStatus("unauthenticated");
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
    const fromResponse = axiosResponse
      ? normalizeUserPayload(axiosResponse.data)
      : null;

    const { user: fromMe, error: meError } =
      await fetchCurrentUserResilient();

    const nextUser = fromMe ?? fromResponse;

    if (meError && !nextUser?.userId) {
      clearSessionStorage();
      setUser(null);
      setStatus("unauthenticated");
      const status =
        meError &&
        typeof meError === "object" &&
        meError.isAxiosError === true
          ? meError.response?.status
          : undefined;
      const msg =
        status === 401 || status === 403
          ? "Could not confirm your sign-in. On mobile, auth cookies often fail when the API is on another domain—the server needs SameSite=None (Secure) cookies and your exact site URL in CORS. You can also try again in a few seconds."
          : "Could not verify your session. Check your connection and try again.";
      throw new SessionVerificationError(msg);
    }

    if (!nextUser?.userId) {
      clearSessionStorage();
      setUser(null);
      setStatus("unauthenticated");
      throw new SessionVerificationError(
        "Signed in, but your profile could not be loaded. Try again.",
      );
    }

    setUser(nextUser);
    writeDisplayProfile(nextUser);
    setStatus("authenticated");
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

  /**
   * Merge **AuthMeResponse** (or same shape) from PATCH/verify/send-code without a separate GET /auth/me.
   * @param {unknown} data
   * @returns {AuthUser | null}
   */
  const applyMeResponse = useCallback((data) => {
    let mergedOut = null;
    setUser((prev) => {
      const merged = mergeAuthMeData(prev, data);
      mergedOut = merged;
      if (merged) {
        writeDisplayProfile(merged);
        return merged;
      }
      return prev;
    });
    return mergedOut;
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
      applyMeResponse,
    }),
    [status, user, establishSession, logout, refreshUser, applyMeResponse],
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
