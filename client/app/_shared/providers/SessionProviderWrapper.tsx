"use client";

import { SessionProvider } from "next-auth/react";
import { useSession } from "next-auth/react";
import React, { useEffect } from "react";
import { setClientSession } from "@/app/lib/client-session-store";

function SessionBridge() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "loading") return;
    setClientSession(session ?? null);
  }, [session, status]);

  return null;
}

export default function SessionProviderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider
      basePath="/api/auth"
      refetchInterval={0}
      refetchOnWindowFocus={false}
      refetchWhenOffline={false}
    >
      <SessionBridge />
      {children}
    </SessionProvider>
  );
}
