"use client";

import { AuthProvider } from "./AuthProvider";
import PageTransition from "./PageTransition";
import { ReactNode } from "react";

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <PageTransition>{children}</PageTransition>
    </AuthProvider>
  );
}
