import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Role, User } from "@/types";
import { authService, type Actor } from "@/services";

const STORAGE_KEY = "civicbridge.session";

interface AuthContextValue {
  user: User | null;
  actor: Actor | null;
  isAuthenticated: boolean;
  hydrated: boolean;
  login: (email: string) => Promise<User>;
  register: (input: { name: string; email: string; role: Role; district?: string; state?: string }) => Promise<User>;
  logout: () => void;
  hasRole: (roles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw) as User);
    } catch {
      /* ignore corrupt session */
    }
    setHydrated(true);
  }, []);

  const persist = useCallback((next: User | null) => {
    setUser(next);
    if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    else localStorage.removeItem(STORAGE_KEY);
  }, []);

  const login = useCallback(
    async (email: string) => {
      const { user: loggedIn } = await authService.login(email);
      persist(loggedIn);
      return loggedIn;
    },
    [persist],
  );

  const register = useCallback(
    async (input: { name: string; email: string; role: Role; district?: string; state?: string }) => {
      const { user: created } = await authService.register(input);
      persist(created);
      return created;
    },
    [persist],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      actor: user ? { id: user.id, name: user.name, role: user.role } : null,
      isAuthenticated: Boolean(user),
      hydrated,
      login,
      register,
      logout: () => persist(null),
      hasRole: (roles: Role[]) => Boolean(user && roles.includes(user.role)),
    }),
    [user, hydrated, login, register, persist],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export function homeRouteForRole(role: Role): string {
  switch (role) {
    case "citizen":
      return "/citizen";
    case "student":
      return "/student";
    case "university":
      return "/university";
    case "organization":
      return "/organization";
    case "officer":
    case "gov_admin":
      return "/government";
    default:
      return "/admin";
  }
}
