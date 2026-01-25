"use client";

import { AuthProvider, useAuth } from "./AuthProvider";
import { ThemeProvider } from "./ThemeProvider";
import PageTransition from "./PageTransition";
import GlobalHeader from "./GlobalHeader";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";

function LayoutContent({ children }: { children: ReactNode }) {
  const { usuario, cargando } = useAuth();
  const pathname = usePathname();

  // No mostrar header en login
  const isLoginPage = pathname === "/login";

  // Mientras carga, mostrar spinner
  if (cargando) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Cargando...</p>
      </div>
    );
  }

  // Si no hay usuario y no estamos en login, el AuthProvider redirigirá
  if (!usuario && !isLoginPage) {
    return null;
  }

  // En login, no mostrar header
  if (isLoginPage) {
    return <PageTransition>{children}</PageTransition>;
  }

  // Layout principal con header persistente
  return (
    <div className="app-shell">
      <GlobalHeader />
      <div className="app-main">
        <PageTransition>{children}</PageTransition>
      </div>
    </div>
  );
}

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LayoutContent>{children}</LayoutContent>
      </AuthProvider>
    </ThemeProvider>
  );
}
