"use client";

import { useAuth } from "./AuthProvider";
import ThemeToggle from "./ThemeToggle";

export default function GlobalHeader() {
  const { usuario, cerrarSesion } = useAuth();

  return (
    <header className="global-header">
      <div className="header-left">
        <h1 className="header-title">
          Gestion de <span className="header-title-accent">Chatbot</span>
        </h1>
      </div>

      <div className="header-right">
        <ThemeToggle />

        {usuario && (
          <div className="header-user">
            <svg viewBox="0 0 24 24" fill="currentColor" className="header-user-icon">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
            <span className="header-user-name">{usuario.nombre || usuario.usuario}</span>
          </div>
        )}

        <button className="header-logout" onClick={cerrarSesion} title="Cerrar sesion">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
          </svg>
          <span>Salir</span>
        </button>
      </div>
    </header>
  );
}
