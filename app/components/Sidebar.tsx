"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

interface SidebarProps {
  onClose?: () => void;
}

interface Conversacion {
  guid: string;
  telefonocliente: string;
  contexto: string;
  pregunta: string;
  estado: string;
  paso: string;
  accion: string | null;
  respuesta: string | null;
  creado: string;
}

function truncarTexto(texto: string | null, maxLength: number): string {
  if (!texto) return "";
  if (texto.length <= maxLength) return texto;
  return texto.substring(0, maxLength) + "...";
}

function formatearFecha(fecha: string): string {
  const date = new Date(fecha);
  const hoy = new Date();
  const ayer = new Date(hoy);
  ayer.setDate(ayer.getDate() - 1);

  if (date.toDateString() === hoy.toDateString()) {
    return date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  } else if (date.toDateString() === ayer.toDateString()) {
    return "Ayer";
  } else {
    return date.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" });
  }
}

function getPasoColor(paso: string | null): string {
  if (!paso) return "#999";
  const pasoLower = paso.toLowerCase();
  if (pasoLower.includes("necesidad")) return "#075e54";
  if (pasoLower.includes("accion")) return "#fb8c00";
  if (pasoLower.includes("proceso")) return "#1976d2";
  if (pasoLower.includes("cierre")) return "#43a047";
  return "#666";
}

function getEstadoIcon(estado: string) {
  if (estado === "pendiente") {
    return (
      <span className="estado-badge pendiente" title="Pendiente">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/>
        </svg>
      </span>
    );
  }
  return (
    <span className="estado-badge completado" title="Completado">
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
      </svg>
    </span>
  );
}

export default function Sidebar({ onClose }: SidebarProps) {
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState<"todos" | "pendiente" | "completado">("todos");
  const searchParams = useSearchParams();
  const guidActual = searchParams.get("guid");

  useEffect(() => {
    fetchConversaciones();
  }, []);

  const fetchConversaciones = async () => {
    try {
      const res = await fetch("/api/conversaciones");
      if (res.ok) {
        const data = await res.json();
        setConversaciones(data);
      }
    } catch (error) {
      console.error("Error al cargar conversaciones:", error);
    } finally {
      setCargando(false);
    }
  };

  const conversacionesFiltradas = conversaciones.filter((c) => {
    if (filtro === "todos") return true;
    return c.estado === filtro;
  });

  const contadores = {
    todos: conversaciones.length,
    pendiente: conversaciones.filter((c) => c.estado === "pendiente").length,
    completado: conversaciones.filter((c) => c.estado === "completado").length,
  };

  const handleConversacionClick = () => {
    if (onClose) onClose();
  };

  return (
    <>
      {/* Header del sidebar */}
      <div className="sidebar-header">
        <h2>Conversaciones</h2>
        <div className="sidebar-header-actions">
          <button className="refresh-btn" onClick={fetchConversaciones} title="Actualizar">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
            </svg>
          </button>
          {onClose && (
            <button className="close-btn" onClick={onClose} title="Cerrar">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="sidebar-filtros">
        <button
          className={`filtro-btn ${filtro === "todos" ? "active" : ""}`}
          onClick={() => setFiltro("todos")}
        >
          Todos ({contadores.todos})
        </button>
        <button
          className={`filtro-btn ${filtro === "pendiente" ? "active" : ""}`}
          onClick={() => setFiltro("pendiente")}
        >
          Pendientes ({contadores.pendiente})
        </button>
        <button
          className={`filtro-btn ${filtro === "completado" ? "active" : ""}`}
          onClick={() => setFiltro("completado")}
        >
          Completados ({contadores.completado})
        </button>
      </div>

      {/* Lista de conversaciones */}
      <div className="sidebar-lista">
        {cargando ? (
          <div className="sidebar-loading">
            <div className="loading-spinner"></div>
            <p>Cargando...</p>
          </div>
        ) : conversacionesFiltradas.length === 0 ? (
          <div className="sidebar-vacio">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/>
            </svg>
            <p>No hay conversaciones</p>
          </div>
        ) : (
          conversacionesFiltradas.map((conv) => (
            <a
              key={conv.guid}
              href={`/?guid=${conv.guid}`}
              className={`conversacion-item ${guidActual === conv.guid ? "active" : ""} ${conv.estado}`}
              onClick={handleConversacionClick}
            >
              {/* Avatar con inicial del telefono */}
              <div className="conv-avatar">
                <span>{conv.telefonocliente?.slice(-2) || "??"}</span>
              </div>

              {/* Contenido */}
              <div className="conv-contenido">
                <div className="conv-header">
                  <span className="conv-telefono">{conv.telefonocliente || "Sin telefono"}</span>
                  <span className="conv-fecha">{formatearFecha(conv.creado)}</span>
                </div>

                <div className="conv-preview">
                  {truncarTexto(conv.contexto, 50)}
                </div>

                <div className="conv-footer">
                  <span
                    className="conv-paso"
                    style={{ backgroundColor: getPasoColor(conv.paso) }}
                  >
                    {conv.paso || "Sin paso"}
                  </span>
                  {getEstadoIcon(conv.estado)}
                </div>
              </div>
            </a>
          ))
        )}
      </div>
    </>
  );
}
