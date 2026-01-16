"use client";

import { AuthProvider } from "./AuthProvider";
import { ReactNode } from "react";

export default function ClientLayout({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
