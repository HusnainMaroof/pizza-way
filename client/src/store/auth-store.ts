import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * PLACEHOLDER AUTH (no backend yet): keeps only the signed-in profile on this device.
 * Passwords are validated by the forms but NEVER stored or sent anywhere.
 */
export type AuthUser = { name: string; email: string };

type AuthState = {
  user: AuthUser | null;
  signIn: (user: AuthUser) => void;
  updateProfile: (user: AuthUser) => void;
  signOut: () => void;
};

/** "sarah.jones@x.com" -> "Sarah Jones" (used when signing in without a name). */
export function nameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "";
  const words = local.split(/[._\-+0-9]+/).filter(Boolean);
  const name = words.map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
  return name || "Pizza Fan";
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      signIn: (user) => set({ user }),
      updateProfile: (user) => set({ user }),
      signOut: () => set({ user: null }),
    }),
    { name: "pizzaway-auth", partialize: (s) => ({ user: s.user }), skipHydration: true },
  ),
);
