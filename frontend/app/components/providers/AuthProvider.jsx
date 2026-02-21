"use client";

import { useEffect } from "react";
import { useAuthActions } from "@/store/authStore";

export function AuthProvider({ children }) {
  const { initializeAuth } = useAuthActions();

  useEffect(() => {
    const cleanup = initializeAuth();
    return () => {
      if (typeof cleanup === "function") cleanup();
    };
  }, [initializeAuth]);

  return children;
}
