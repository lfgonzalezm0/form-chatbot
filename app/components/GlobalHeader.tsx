"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";
import ThemeToggle from "./ThemeToggle";

export default function GlobalHeader() {
  const { usuario, cerrarSesion } = useAuth();
  const pathname = usePathname();

  const isHome = pathname === "/";

  return (
    <header className="global-header">
      <div className="header-left">
        {!isHome && (
          <Link href="/" className="header-back-btn" title="Volver al inicio">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
            </svg>
          </Link>
        )}
        <Link href="/" className="header-brand">
          <div className="header-logo">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
            </svg>
          </div>
          <h1 className="header-title">
            Gestión de <span className="header-title-accent">Chatbot</span>
          </h1>
        </Link>
      </div>

      <div className="header-right">
        <ThemeToggle />

        {usuario && (
          <div className="header-user">
            <div className="header-user-avatar">
              {usuario.nombre?.charAt(0).toUpperCase() || usuario.usuario?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="header-user-info">
              <span className="header-user-name">{usuario.nombre || usuario.usuario}</span>
              <span className="header-user-role">{usuario.tipousuario}</span>
            </div>
          </div>
        )}

        <button className="header-logout" onClick={cerrarSesion} title="Cerrar sesión">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
          </svg>
        </button>
      </div>
    </header>
  );
}
