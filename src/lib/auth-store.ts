import { create } from "zustand";
import { api, clearToken, readToken, writeToken } from "./api";
import type { AppUser } from "./types";

interface AuthState {
  user: AppUser | null;
  ready: boolean;
  setUser: (u: AppUser | null) => void;
  /** Restore the session from a stored token on first client render. */
  hydrate: () => Promise<void>;
  signIn: (userId: string, password: string, remember: boolean) => Promise<AppUser>;
  signOut: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  ready: false,
  setUser: (user) => set({ user }),

  hydrate: async () => {
    if (!readToken()) {
      set({ user: null, ready: true });
      return;
    }
    try {
      const user = await api.me();
      set({ user, ready: true });
    } catch {
      clearToken();
      set({ user: null, ready: true });
    }
  },

  signIn: async (userId, password, remember) => {
    const { user, token } = await api.login(userId, password);
    writeToken(token, remember);
    set({ user, ready: true });
    return user;
  },

  signOut: () => {
    clearToken();
    set({ user: null, ready: true });
  },
}));
