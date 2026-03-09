"use client";

import {
  usePathname as useNextPathname,
  useRouter as useNextRouter,
} from "next/navigation";

type NavigateTarget = string;

export function useRouter() {
  const router = useNextRouter();

  return {
    push: (to: NavigateTarget) => router.push(to),
    replace: (to: NavigateTarget) => router.replace(to),
    back: () => router.back(),
    forward: () => router.forward(),
    refresh: () => router.refresh(),
  };
}

export function usePathname() {
  return useNextPathname();
}
