import { create } from "zustand";
import { api, clearToken, readToken, writeToken, OFFLINE_MODE } from "./api";
import { supabase } from "./supabase";
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
    if (OFFLINE_MODE) {
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
      return;
    }

    // Online mode: Supabase's own persisted session is the source of truth,
    // not the local `jamui.token` (which is kept only for interface parity).
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        set({ user: null, ready: true });
        return;
      }
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
    if (!OFFLINE_MODE) {
      // Fire and forget — don't block the UI on network latency, but make
      // sure the Supabase session is actually terminated server-side too.
      supabase.auth.signOut().catch(() => {
        /* session will still be cleared client-side below */
      });
    }
    clearToken();
    set({ user: null, ready: true });
  },
}));