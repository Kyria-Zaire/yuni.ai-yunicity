"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { sha256Hex } from "./hash";

const SESSION_COOKIE = "yuni-auth";
const JWT_COOKIE = "yuni-jwt";
const COOKIE_MAX_AGE_S = 60 * 60 * 8;

export interface AuthUser {
  email: string;
  /** Identifiant stable pour l’affichage */
  id: string;
  /** SHA-256 hex du user_id (MVP : hash de l’email) */
  hash: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  /** JWT brut — uniquement pour appels API ; ne jamais persister */
  getAccessToken: () => string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function setSessionCookies(active: boolean, jwt: string | null) {
  if (typeof document === "undefined") {
    return;
  }
  if (active && jwt) {
    document.cookie = `${SESSION_COOKIE}=1; path=/; max-age=${COOKIE_MAX_AGE_S}; SameSite=Lax`;
    document.cookie = `${JWT_COOKIE}=${encodeURIComponent(jwt)}; path=/; max-age=${COOKIE_MAX_AGE_S}; SameSite=Lax`;
  } else {
    document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0`;
    document.cookie = `${JWT_COOKIE}=; path=/; max-age=0`;
  }
}

/**
 * MVP standalone : connexion simulée — en prod, échanger contre le flux Yunicity.
 * Le JWT reste en mémoire React ; un cookie de session minimal sert au middleware Next.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearRefreshTimer = () => {
    if (refreshTimer.current) {
      clearTimeout(refreshTimer.current);
      refreshTimer.current = null;
    }
  };

  const logout = useCallback(() => {
    clearRefreshTimer();
    setToken(null);
    setUser(null);
    setSessionCookies(false, null);
  }, []);

  const scheduleRefresh = useCallback(
    (jwt: string) => {
      clearRefreshTimer();
      try {
        const parts = jwt.split(".");
        if (parts.length !== 3) {
          return;
        }
        const json = JSON.parse(
          atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")),
        ) as { exp?: number };
        if (!json.exp) {
          return;
        }
        const ms = json.exp * 1000 - Date.now() - 60_000;
        if (ms > 0) {
          refreshTimer.current = setTimeout(() => {
            logout();
          }, ms);
        }
      } catch {
        /* ignore */
      }
    },
    [logout],
  );

  const login = useCallback(async (email: string, password: string) => {
    if (!email.trim() || !password) {
      throw new Error("Email et mot de passe requis");
    }
    const hash = await sha256Hex(email.trim().toLowerCase());
    const payload = {
      sub: hash,
      exp: Math.floor(Date.now() / 1000) + 3600,
      role: "city_dashboard",
      city: "reims",
    };
    const mockJwt = [
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
      btoa(JSON.stringify(payload)),
      "mock-signature",
    ].join(".");
    setToken(mockJwt);
    setUser({
      email: email.trim(),
      id: hash.slice(0, 16),
      hash,
    });
    setSessionCookies(true, mockJwt);
    scheduleRefresh(mockJwt);
  }, [scheduleRefresh]);

  useEffect(() => () => clearRefreshTimer(), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      login,
      logout,
      getAccessToken: () => token,
    }),
    [user, token, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth doit être utilisé sous <AuthProvider>");
  }
  return ctx;
}
