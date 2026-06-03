"use client";

import { SessionProvider, signOut } from "next-auth/react";
import { useEffect } from "react";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const { fetch: originalFetch } = window;

    // Intercept fetch to handle 401 Unauthorized (session expired)
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);

      if (response.status === 401) {
        const url = typeof args[0] === "string" 
          ? args[0] 
          : args[0] instanceof URL 
            ? args[0].href 
            : (args[0] as Request).url;

        if (url && (url.startsWith("/api") || url.startsWith(window.location.origin + "/api"))) {
          if (!(window as any)._isSigningOut) {
            (window as any)._isSigningOut = true;
            signOut({ callbackUrl: "/login" });
          }
        }
      }

      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return <SessionProvider>{children}</SessionProvider>;
}
