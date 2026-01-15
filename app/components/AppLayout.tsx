"use client";

import { Suspense, useState } from "react";
import Sidebar from "./Sidebar";

interface Props {
  children: React.ReactNode;
}

export default function AppLayout({ children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-container">
      {/* Overlay para cerrar sidebar en movil */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <Suspense fallback={<div className="sidebar-loading">Cargando...</div>}>
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </Suspense>
      </div>

      {/* Boton hamburguesa para movil */}
      <button
        className="mobile-menu-btn"
        onClick={() => setSidebarOpen(true)}
        aria-label="Abrir menu"
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
        </svg>
      </button>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
