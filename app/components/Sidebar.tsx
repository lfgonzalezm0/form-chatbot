"use client";

import { useEffect, useState } from "react";
import type { Seccion } from "./AppLayout";
import { useAuth } from "./AuthProvider";
import NavMenu from "./NavMenu";
import ThemeToggle from "./ThemeToggle";

interface SidebarProps {
  seccionActiva: Seccion;
  onSeccionChange: (seccion: Seccion) => void;
  guidSeleccionado: string | null;
  onSeleccionConversacion: (guid: string) => void;
  onClose?: () => void;
  refreshKey?: number;
}

interface Conversacion {
  guid: string;
  telefonocliente: string;
  contexto: string;
  pregunta: string;
  estado: string;
  paso: string;
  accionadmin: string | null;
  respuesta: string | null;
  creado: string;
  nombreusuario: string | null;
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
  if (pasoLower.includes("acción")) return "#fb8c00";
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

export default function Sidebar({
  seccionActiva,
  onSeccionChange,
  guidSeleccionado,
  onSeleccionConversacion,
  onClose,
  refreshKey,
}: SidebarProps) {
  const { usuario, cerrarSesion } = useAuth();
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<"todos" | "pendiente" | "cerrado">("pendiente");

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

  useEffect(() => {
    fetchConversaciones();
  }, []);

  // Recargar cuando refreshKey cambie
  useEffect(() => {
    if (refreshKey && refreshKey > 0) {
      fetchConversaciones();
    }
  }, [refreshKey]);

  // Resetear filtro a "pendiente" cuando cambie la seccion
  useEffect(() => {
    setFiltro("pendiente");
  }, [seccionActiva]);

  // Filtrar por seccion (paso) primero, luego por estado y busqueda
  const conversacionesFiltradas = conversaciones.filter((c) => {
    // Filtro por seccion (paso)
    const pasoLower = (c.paso || "").toLowerCase();
    if (seccionActiva === "Necesidad" && !pasoLower.includes("necesidad")) return false;
    if (seccionActiva === "Acción" && !pasoLower.includes("acción")) return false;

    // Filtro por estado
    if (filtro !== "todos" && c.estado !== filtro) return false;

    // Filtro por busqueda
    if (busqueda.trim()) {
      const searchLower = busqueda.toLowerCase();
      return (
        c.telefonocliente?.toLowerCase().includes(searchLower) ||
        c.contexto?.toLowerCase().includes(searchLower) ||
        c.pregunta?.toLowerCase().includes(searchLower) ||
        c.paso?.toLowerCase().includes(searchLower)
      );
    }

    return true;
  });

  // Contadores basados en la seccion activa
  const conversacionesSeccion = conversaciones.filter((c) => {
    const pasoLower = (c.paso || "").toLowerCase();
    if (seccionActiva === "Necesidad") return pasoLower.includes("necesidad");
    if (seccionActiva === "Acción") return pasoLower.includes("acción");
    return false;
  });

  const contadores = {
    todos: conversacionesSeccion.length,
    pendiente: conversacionesSeccion.filter((c) => c.estado === "pendiente").length,
    cerrado: conversacionesSeccion.filter((c) => c.estado === "cerrado").length,
  };

  // Contadores globales por seccion
  const contadoresSeccion = {
    necesidad: conversaciones.filter((c) => (c.paso || "").toLowerCase().includes("necesidad")).length,
    accion: conversaciones.filter((c) => (c.paso || "").toLowerCase().includes("acción")).length,
  };

  const handleConversacionClick = (guid: string) => {
    onSeleccionConversacion(guid);
  };

  return (
    <>
      {/* Header del sidebar */}
      <div className="sidebar-header">
        <div className="sidebar-header-left">
          <NavMenu />
        </div>
        <div className="sidebar-header-actions">
          <ThemeToggle />
          <button className="refresh-btn" onClick={fetchConversaciones} title="Actualizar">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
            </svg>
          </button>
          <button className="logout-btn" onClick={cerrarSesion} title="Cerrar sesion">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
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

      {/* Usuario actual */}
      {usuario && (
        <div className="sidebar-usuario">
          <div className="usuario-avatar">
            {usuario.nombre?.charAt(0).toUpperCase() || usuario.usuario?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="usuario-info">
            <span className="usuario-nombre">{usuario.nombre || usuario.usuario}</span>
            <span className="usuario-tipo">{usuario.tipousuario}</span>
          </div>
        </div>
      )}

      {/* Menu principal de secciones */}
      <div className="sidebar-secciones">
        <button
          className={`seccion-btn ${seccionActiva === "Necesidad" ? "active" : ""}`}
          onClick={() => onSeccionChange("Necesidad")}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
          </svg>
          <span>Necesidad</span>
          <span className="seccion-count">{contadoresSeccion.necesidad}</span>
        </button>
        <button
          className={`seccion-btn ${seccionActiva === "Acción" ? "active" : ""}`}
          onClick={() => onSeccionChange("Acción")}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>
          </svg>
          <span>Acción</span>
          <span className="seccion-count">{contadoresSeccion.accion}</span>
        </button>
      </div>

      {/* Filtros de estado */}
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
          className={`filtro-btn ${filtro === "cerrado" ? "active" : ""}`}
          onClick={() => setFiltro("cerrado")}
        >
          Completados ({contadores.cerrado})
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
            <p>No hay conversaciones en {seccionActiva}</p>
          </div>
        ) : (
          conversacionesFiltradas.map((conv) => (
            <div
              key={conv.guid}
              className={`conversacion-item ${guidSeleccionado === conv.guid ? "active" : ""} ${conv.estado}`}
              onClick={() => handleConversacionClick(conv.guid)}
            >
              {/* Avatar con inicial del telefono */}
              <div className="conv-avatar">
                <span>{conv.telefonocliente?.slice(-2) || "??"}</span>
              </div>

              {/* Contenido */}
              <div className="conv-contenido">
                <div className="conv-header">
                  <span className="conv-telefono">
                    {conv.nombreusuario || conv.telefonocliente || "Sin telefono"}
                  </span>
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
            </div>
          ))
        )}
      </div>
    </>
  );
}
