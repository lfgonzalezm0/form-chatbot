"use client";

import { Suspense, useState, useCallback } from "react";
import SidebarPreguntas from "./SidebarPreguntas";
import PreguntaDetalle from "./PreguntaDetalle";

export default function PreguntasModule() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [idSeleccionado, setIdSeleccionado] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSeleccionPregunta = useCallback((id: number) => {
    setIdSeleccionado(id);
    setSidebarOpen(false);
  }, []);

  const handlePreguntaActualizada = useCallback(() => {
    setRefreshKey((k) => k + 1);
    setIdSeleccionado(null);
  }, []);

  const handlePreguntaEliminada = useCallback(() => {
    setIdSeleccionado(null);
  }, []);

  return (
    <div className="module-container">
      {/* Overlay para cerrar sidebar en movil */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`module-sidebar ${sidebarOpen ? "open" : ""}`}>
        <Suspense fallback={<div className="sidebar-loading">Cargando...</div>}>
          <SidebarPreguntas
            idSeleccionado={idSeleccionado}
            onSeleccionPregunta={handleSeleccionPregunta}
            onClose={() => setSidebarOpen(false)}
            refreshKey={refreshKey}
            onPreguntaEliminada={handlePreguntaEliminada}
          />
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

      <main className="module-content">
        <PreguntaDetalle
          id={idSeleccionado}
          onPreguntaActualizada={handlePreguntaActualizada}
        />
      </main>
    </div>
  );
}
