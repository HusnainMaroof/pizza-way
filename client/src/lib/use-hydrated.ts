"use client";

import { useSyncExternalStore } from "react";
import { useAuthStore } from "@/store/auth-store";

type PersistApi = {
  hasHydrated: () => boolean;
  onFinishHydration: (fn: () => void) => () => void;
};

/** True once a persisted store has loaded from localStorage (false on the server and first render). */
export function usePersistHydrated(persist: PersistApi): boolean {
  return useSyncExternalStore(
    (cb) => persist.onFinishHydration(cb),
    () => persist.hasHydrated(),
    () => false,
  );
}

export function useAuthHydrated(): boolean {
  return usePersistHydrated(useAuthStore.persist);
}
