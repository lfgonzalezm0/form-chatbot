"use client";

import { Suspense, useState, useCallback } from "react";
import Sidebar from "./Sidebar";
import ConversacionDetalle from "./ConversacionDetalle";
import { useAuth } from "./AuthProvider";

export type Seccion = "Necesidad" | "Acción";

export default function AppLayout() {
  const { usuario, cargando } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [seccionActiva, setSeccionActiva] = useState<Seccion>("Necesidad");
  const [guidSeleccionado, setGuidSeleccionado] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSeleccionConversacion = useCallback((guid: string) => {
    setGuidSeleccionado(guid);
    setSidebarOpen(false);
  }, []);

  const handleConversacionActualizada = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  if (cargando) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Cargando...</p>
      </div>
    );
  }

  if (!usuario) {
    return null;
  }

  return (
    <div className="module-container">
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className={`module-sidebar ${sidebarOpen ? "open" : ""}`}>
        <Suspense fallback={<div className="sidebar-loading">Cargando...</div>}>
          <Sidebar
            seccionActiva={seccionActiva}
            onSeccionChange={setSeccionActiva}
            guidSeleccionado={guidSeleccionado}
            onSeleccionConversacion={handleSeleccionConversacion}
            onClose={() => setSidebarOpen(false)}
            refreshKey={refreshKey}
          />
        </Suspense>
      </div>

      <button
        className="mobile-menu-btn"
        onClick={() => setSidebarOpen(true)}
        aria-label="Abrir menu"
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
        </svg>
      </button>

      <main className="module-content">
        <ConversacionDetalle
          guid={guidSeleccionado}
          onConversacionActualizada={handleConversacionActualizada}
        />
      </main>
    </div>
  );
}
