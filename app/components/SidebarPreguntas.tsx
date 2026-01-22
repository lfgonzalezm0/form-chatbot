"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";
import NavMenu from "./NavMenu";

interface SidebarPreguntasProps {
  idSeleccionado: number | null;
  onSeleccionPregunta: (id: number) => void;
  onClose?: () => void;
  refreshKey?: number;
  onPreguntaEliminada?: () => void;
}

interface PreguntaPendiente {
  id: number;
  telefonocaso: string | null;
  categoria: string;
  necesidad: string;
  pregunta: string;
  respuesta: string | null;
  variante: string | null;
  urlimagen: string | null;
  videourl: string | null;
  habilitado: boolean;
  contexto: string | null;
  cuenta_nombre?: string | null;
}

function truncarTexto(texto: string | null, maxLength: number): string {
  if (!texto) return "";
  if (texto.length <= maxLength) return texto;
  return texto.substring(0, maxLength) + "...";
}

function getCategoriaColor(categoria: string | null): string {
  if (!categoria) return "#999";
  const categoriaLower = categoria.toLowerCase();
  if (categoriaLower.includes("información")) return "#1976d2";
  if (categoriaLower.includes("compra")) return "#43a047";
  if (categoriaLower.includes("reserva")) return "#fb8c00";
  if (categoriaLower.includes("soporte")) return "#e53935";
  if (categoriaLower.includes("pago")) return "#8e24aa";
  return "#666";
}

export default function SidebarPreguntas({
  idSeleccionado,
  onSeleccionPregunta,
  onClose,
  refreshKey,
  onPreguntaEliminada,
}: SidebarPreguntasProps) {
  const { usuario, cerrarSesion } = useAuth();
  const [preguntas, setPreguntas] = useState<PreguntaPendiente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState<string>("");
  const [confirmandoEliminar, setConfirmandoEliminar] = useState<number | null>(null);
  const [eliminando, setEliminando] = useState(false);

  // Categorías únicas
  const [categorias, setCategorias] = useState<string[]>([]);

  const fetchPreguntas = async () => {
    try {
      setCargando(true);
      const res = await fetch("/api/preguntas-pendientes");
      if (res.ok) {
        const data = await res.json();
        setPreguntas(data);

        // Extraer categorías únicas
        const cats = [...new Set(data.map((p: PreguntaPendiente) => p.categoria).filter(Boolean))] as string[];
        setCategorias(cats);
      }
    } catch (error) {
      console.error("Error al cargar preguntas:", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    fetchPreguntas();
  }, []);

  // Recargar cuando refreshKey cambie
  useEffect(() => {
    if (refreshKey && refreshKey > 0) {
      fetchPreguntas();
    }
  }, [refreshKey]);

  // Filtrar preguntas
  const preguntasFiltradas = preguntas.filter((p) => {
    // Filtro por categoría
    if (filtroCategoria && p.categoria !== filtroCategoria) return false;

    // Filtro por búsqueda
    if (busqueda.trim()) {
      const searchLower = busqueda.toLowerCase();
      return (
        p.pregunta?.toLowerCase().includes(searchLower) ||
        p.necesidad?.toLowerCase().includes(searchLower) ||
        p.categoria?.toLowerCase().includes(searchLower) ||
        p.contexto?.toLowerCase().includes(searchLower)
      );
    }

    return true;
  });

  const handlePreguntaClick = (id: number) => {
    onSeleccionPregunta(id);
  };

  const handleEliminarPregunta = async (id: number) => {
    setEliminando(true);
    try {
      const res = await fetch(`/api/preguntas/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar");

      // Remover de la lista local
      setPreguntas((prev) => prev.filter((p) => p.id !== id));
      setConfirmandoEliminar(null);

      // Notificar al padre si la pregunta eliminada era la seleccionada
      if (idSeleccionado === id && onPreguntaEliminada) {
        onPreguntaEliminada();
      }
    } catch (error) {
      console.error("Error al eliminar pregunta:", error);
      alert("Error al eliminar la pregunta");
    } finally {
      setEliminando(false);
    }
  };

  return (
    <>
      {/* Header del sidebar */}
      <div className="sidebar-header">
        <div className="sidebar-header-left">
          <NavMenu />
        </div>
        <div className="sidebar-header-actions">
          <button className="refresh-btn" onClick={fetchPreguntas} title="Actualizar">
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

      {/* Título del módulo */}
      <div className="sidebar-titulo-modulo">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
        </svg>
        <span>Preguntas Pendientes</span>
        <span className="sidebar-count">{preguntas.length}</span>
      </div>

      {/* Filtro por categoría */}
      <div className="sidebar-filtro-categoria">
        <select
          value={filtroCategoria}
          onChange={(e) => setFiltroCategoria(e.target.value)}
        >
          <option value="">Todas las categorías</option>
          {categorias.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Búsqueda */}
      <div className="sidebar-busqueda">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
        </svg>
        <input
          type="text"
          placeholder="Buscar pregunta..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {/* Lista de preguntas */}
      <div className="sidebar-lista">
        {cargando ? (
          <div className="sidebar-loading">
            <div className="loading-spinner"></div>
            <p>Cargando...</p>
          </div>
        ) : preguntasFiltradas.length === 0 ? (
          <div className="sidebar-vacio">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
            </svg>
            <p>No hay preguntas pendientes</p>
          </div>
        ) : (
          preguntasFiltradas.map((pregunta) => (
            <div
              key={pregunta.id}
              className={`conversacion-item ${idSeleccionado === pregunta.id ? "active" : ""} pendiente`}
              onClick={() => handlePreguntaClick(pregunta.id)}
            >
              {/* Avatar con inicial de la categoría */}
              <div className="conv-avatar" style={{ backgroundColor: getCategoriaColor(pregunta.categoria) }}>
                <span>{pregunta.categoria?.charAt(0).toUpperCase() || "?"}</span>
              </div>

              {/* Contenido */}
              <div className="conv-contenido">
                <div className="conv-header">
                  <span className="conv-telefono">
                    {pregunta.necesidad || "Sin necesidad"}
                  </span>
                  {pregunta.cuenta_nombre && (
                    <span className="conv-cuenta-badge">{pregunta.cuenta_nombre}</span>
                  )}
                </div>

                <div className="conv-preview">
                  {truncarTexto(pregunta.pregunta, 60)}
                </div>

                <div className="conv-footer">
                  <span
                    className="conv-paso"
                    style={{ backgroundColor: getCategoriaColor(pregunta.categoria) }}
                  >
                    {pregunta.categoria || "Sin categoría"}
                  </span>
                  <span className="estado-badge pendiente" title="Pendiente">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/>
                    </svg>
                  </span>
                </div>
              </div>

              {/* Botón eliminar */}
              <button
                className="conv-btn-eliminar"
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmandoEliminar(pregunta.id);
                }}
                title="Eliminar pregunta"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>

      {/* Modal de confirmación de eliminar */}
      {confirmandoEliminar && (
        <div className="modal-overlay-sidebar" onClick={() => setConfirmandoEliminar(null)}>
          <div className="modal-confirmar-eliminar" onClick={(e) => e.stopPropagation()}>
            <div className="modal-confirmar-header">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
              <h3>Eliminar pregunta</h3>
            </div>
            <p>¿Está seguro de eliminar esta pregunta? Esta acción no se puede deshacer.</p>
            <div className="modal-confirmar-acciones">
              <button
                className="btn-cancelar-modal"
                onClick={() => setConfirmandoEliminar(null)}
                disabled={eliminando}
              >
                Cancelar
              </button>
              <button
                className="btn-eliminar-modal"
                onClick={() => handleEliminarPregunta(confirmandoEliminar)}
                disabled={eliminando}
              >
                {eliminando ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
