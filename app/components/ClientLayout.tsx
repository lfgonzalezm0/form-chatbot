"use client";

import { AuthProvider } from "./AuthProvider";
import { ThemeProvider } from "./ThemeProvider";
import PageTransition from "./PageTransition";
import { ReactNode } from "react";

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <PageTransition>{children}</PageTransition>
      </AuthProvider>
    </ThemeProvider>
  );
}
