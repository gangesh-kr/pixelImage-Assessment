"use client";

import { SessionProvider } from "next-auth/react";
import React from "react";

export function Providers({ children, session }: { children: React.ReactNode; session?: any }) {
  return (
    <SessionProvider session={session} refetchOnWindowFocus={false} refetchWhenOffline={false}>
      {children}
    </SessionProvider>
  );
}
