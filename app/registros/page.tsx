"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Registro {
  id: number;
  guid: string;
  telefonocliente: string | null;
  telefonoempresa: string | null;
  contexto: string | null;
  pregunta: string | null;
  respuesta: string | null;
  creado: string;
  enlace: string | null;
  estado: string | null;
  accionadmin: string | null;
  paso: string | null;
  bloqueado: boolean | null;
  urlimagen: string | null;
  videourl: string | null;
}

function formatearFecha(fecha: string): string {
  const date = new Date(fecha);
  return date.toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function truncarTexto(texto: string | null, maxLength: number): string {
  if (!texto) return "-";
  if (texto.length <= maxLength) return texto;
  return texto.substring(0, maxLength) + "...";
}

export default function RegistrosPage() {
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [registrosFiltrados, setRegistrosFiltrados] = useState<Registro[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [filtroTexto, setFiltroTexto] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [filtroPaso, setFiltroPaso] = useState<string>("todos");
  const [filtroAccion, setFiltroAccion] = useState<string>("todos");
  const [filtroBloqueado, setFiltroBloqueado] = useState<string>("todos");
  const [filtroFechaDesde, setFiltroFechaDesde] = useState("");
  const [filtroFechaHasta, setFiltroFechaHasta] = useState("");

  // Registro expandido para ver detalles
  const [registroExpandido, setRegistroExpandido] = useState<number | null>(null);

  // Modal de confirmacion para eliminar
  const [confirmandoEliminar, setConfirmandoEliminar] = useState<Registro | null>(null);
  const [eliminando, setEliminando] = useState(false);

  // Previsualizacion de medios
  const [mediaPreview, setMediaPreview] = useState<{ tipo: "imagen" | "video"; url: string } | null>(null);

  useEffect(() => {
    fetchRegistros();
  }, []);

  useEffect(() => {
    aplicarFiltros();
  }, [registros, filtroTexto, filtroEstado, filtroPaso, filtroAccion, filtroBloqueado, filtroFechaDesde, filtroFechaHasta]);

  const fetchRegistros = async () => {
    try {
      setCargando(true);
      const res = await fetch("/api/registros");
      if (!res.ok) throw new Error("Error al cargar registros");
      const data = await res.json();
      setRegistros(data);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los registros");
    } finally {
      setCargando(false);
    }
  };

  const aplicarFiltros = () => {
    let resultado = [...registros];

    // Filtro de texto (busca en telefono, contexto, pregunta, respuesta)
    if (filtroTexto.trim()) {
      const texto = filtroTexto.toLowerCase();
      resultado = resultado.filter(
        (r) =>
          r.telefonocliente?.toLowerCase().includes(texto) ||
          r.telefonoempresa?.toLowerCase().includes(texto) ||
          r.contexto?.toLowerCase().includes(texto) ||
          r.pregunta?.toLowerCase().includes(texto) ||
          r.respuesta?.toLowerCase().includes(texto) ||
          r.guid?.toLowerCase().includes(texto)
      );
    }

    // Filtro por estado
    if (filtroEstado !== "todos") {
      resultado = resultado.filter((r) => r.estado === filtroEstado);
    }

    // Filtro por paso
    if (filtroPaso !== "todos") {
      resultado = resultado.filter((r) =>
        r.paso?.toLowerCase().includes(filtroPaso.toLowerCase())
      );
    }

    // Filtro por accion
    if (filtroAccion !== "todos") {
      resultado = resultado.filter((r) => r.accionadmin === filtroAccion);
    }

    // Filtro por bloqueado
    if (filtroBloqueado !== "todos") {
      const bloqueado = filtroBloqueado === "si";
      resultado = resultado.filter((r) => r.bloqueado === bloqueado);
    }

    // Filtro por fecha desde
    if (filtroFechaDesde) {
      const desde = new Date(filtroFechaDesde);
      resultado = resultado.filter((r) => new Date(r.creado) >= desde);
    }

    // Filtro por fecha hasta
    if (filtroFechaHasta) {
      const hasta = new Date(filtroFechaHasta + "T23:59:59");
      resultado = resultado.filter((r) => new Date(r.creado) <= hasta);
    }

    setRegistrosFiltrados(resultado);
  };

  const limpiarFiltros = () => {
    setFiltroTexto("");
    setFiltroEstado("todos");
    setFiltroPaso("todos");
    setFiltroAccion("todos");
    setFiltroBloqueado("todos");
    setFiltroFechaDesde("");
    setFiltroFechaHasta("");
  };

  const eliminarRegistro = async () => {
    if (!confirmandoEliminar) return;

    try {
      setEliminando(true);
      const res = await fetch(`/api/registros/${confirmandoEliminar.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al eliminar");
      }

      // Actualizar lista local
      setRegistros(registros.filter((r) => r.id !== confirmandoEliminar.id));
      setConfirmandoEliminar(null);
    } catch (err) {
      console.error(err);
      alert("Error al eliminar el registro");
    } finally {
      setEliminando(false);
    }
  };

  // Obtener valores unicos para los selects
  const pasosUnicos = [...new Set(registros.map((r) => r.paso).filter(Boolean))];

  if (cargando) {
    return (
      <div className="registros-page">
        <div className="registros-loading">
          <div className="loading-spinner"></div>
          <p>Cargando registros...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="registros-page">
        <div className="registros-error">
          <p>{error}</p>
          <button onClick={fetchRegistros}>Reintentar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="registros-page">
      {/* Header */}
      <div className="registros-header">
        <div className="registros-header-left">
          <Link href="/" className="registros-back-btn">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
            </svg>
          </Link>
          <h1>Registros de Consultas</h1>
        </div>
        <div className="registros-header-right">
          <span className="registros-count">
            {registrosFiltrados.length} de {registros.length} registros
          </span>
          <button className="refresh-btn" onClick={fetchRegistros} title="Actualizar">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="registros-filtros">
        <div className="filtros-row">
          <div className="filtro-grupo">
            <label>Buscar</label>
            <input
              type="text"
              placeholder="Telefono, contexto, pregunta..."
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
            />
          </div>

          <div className="filtro-grupo">
            <label>Estado</label>
            <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
              <option value="todos">Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="cerrado">Cerrado</option>
            </select>
          </div>

          <div className="filtro-grupo">
            <label>Paso</label>
            <select value={filtroPaso} onChange={(e) => setFiltroPaso(e.target.value)}>
              <option value="todos">Todos</option>
              {pasosUnicos.map((paso) => (
                <option key={paso} value={paso || ""}>
                  {paso}
                </option>
              ))}
            </select>
          </div>

          <div className="filtro-grupo">
            <label>Accion</label>
            <select value={filtroAccion} onChange={(e) => setFiltroAccion(e.target.value)}>
              <option value="todos">Todos</option>
              <option value="responder">Responder</option>
              <option value="ignorar">Ignorar</option>
              <option value="bloquear">Bloquear</option>
            </select>
          </div>

          <div className="filtro-grupo">
            <label>Bloqueado</label>
            <select value={filtroBloqueado} onChange={(e) => setFiltroBloqueado(e.target.value)}>
              <option value="todos">Todos</option>
              <option value="si">Si</option>
              <option value="no">No</option>
            </select>
          </div>
        </div>

        <div className="filtros-row">
          <div className="filtro-grupo">
            <label>Fecha desde</label>
            <input
              type="date"
              value={filtroFechaDesde}
              onChange={(e) => setFiltroFechaDesde(e.target.value)}
            />
          </div>

          <div className="filtro-grupo">
            <label>Fecha hasta</label>
            <input
              type="date"
              value={filtroFechaHasta}
              onChange={(e) => setFiltroFechaHasta(e.target.value)}
            />
          </div>

          <div className="filtro-grupo filtro-acciones">
            <button className="btn-limpiar" onClick={limpiarFiltros}>
              Limpiar filtros
            </button>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="registros-tabla-container">
        <table className="registros-tabla">
          <thead>
            <tr>
              <th>ID</th>
              <th>Creado</th>
              <th>Tel. Cliente</th>
              <th>Tel. Empresa</th>
              <th>Paso</th>
              <th>Estado</th>
              <th>Accion</th>
              <th>Bloqueado</th>
              <th>Contexto</th>
              <th>Pregunta</th>
              <th>Respuesta</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {registrosFiltrados.length === 0 ? (
              <tr>
                <td colSpan={12} className="tabla-vacia">
                  No se encontraron registros
                </td>
              </tr>
            ) : (
              registrosFiltrados.map((registro) => (
                <>
                  <tr key={registro.id} className={registro.estado === "pendiente" ? "fila-pendiente" : ""}>
                    <td>{registro.id}</td>
                    <td>{formatearFecha(registro.creado)}</td>
                    <td>{registro.telefonocliente || "-"}</td>
                    <td>{registro.telefonoempresa || "-"}</td>
                    <td>
                      <span className={`badge-paso ${registro.paso?.toLowerCase().includes("necesidad") ? "necesidad" : registro.paso?.toLowerCase().includes("acción") ? "accion" : ""}`}>
                        {registro.paso || "-"}
                      </span>
                    </td>
                    <td>
                      <span className={`badge-estado ${registro.estado}`}>
                        {registro.estado || "-"}
                      </span>
                    </td>
                    <td>
                      <span className={`badge-accion ${registro.accionadmin || ""}`}>
                        {registro.accionadmin || "-"}
                      </span>
                    </td>
                    <td>
                      <span className={`badge-bloqueado ${registro.bloqueado ? "si" : "no"}`}>
                        {registro.bloqueado ? "Si" : "No"}
                      </span>
                    </td>
                    <td className="celda-texto" title={registro.contexto || ""}>
                      {truncarTexto(registro.contexto, 40)}
                    </td>
                    <td className="celda-texto" title={registro.pregunta || ""}>
                      {truncarTexto(registro.pregunta, 40)}
                    </td>
                    <td className="celda-texto" title={registro.respuesta || ""}>
                      {truncarTexto(registro.respuesta, 40)}
                    </td>
                    <td className="celda-acciones">
                      <button
                        className="btn-ver-detalle"
                        onClick={() => setRegistroExpandido(registroExpandido === registro.id ? null : registro.id)}
                        title="Ver detalle"
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                        </svg>
                      </button>
                      <button
                        className="btn-eliminar"
                        onClick={() => setConfirmandoEliminar(registro)}
                        title="Eliminar registro"
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                  {registroExpandido === registro.id && (
                    <tr className="fila-detalle">
                      <td colSpan={12}>
                        <div className="detalle-contenido">
                          <div className="detalle-grid">
                            <div className="detalle-campo">
                              <strong>GUID:</strong>
                              <span className="guid-texto">{registro.guid}</span>
                            </div>
                            <div className="detalle-campo detalle-campo-full">
                              <strong>Contexto completo:</strong>
                              <p>{registro.contexto || "-"}</p>
                            </div>
                            <div className="detalle-campo detalle-campo-full">
                              <strong>Pregunta completa:</strong>
                              <p>{registro.pregunta || "-"}</p>
                            </div>
                            <div className="detalle-campo detalle-campo-full">
                              <strong>Respuesta completa:</strong>
                              <p>{registro.respuesta || "-"}</p>
                            </div>
                            {(registro.urlimagen || registro.videourl) && (
                              <div className="detalle-campo detalle-campo-full detalle-medios">
                                <strong>Archivos adjuntos:</strong>
                                <div className="medios-grid">
                                  {registro.urlimagen && (
                                    <div className="medio-item">
                                      <img
                                        src={registro.urlimagen}
                                        alt="Imagen adjunta"
                                        onClick={() => setMediaPreview({ tipo: "imagen", url: registro.urlimagen! })}
                                        className="imagen-preview-registro"
                                        title="Clic para ver en grande"
                                      />
                                      <span className="medio-label">Imagen</span>
                                    </div>
                                  )}
                                  {registro.videourl && (
                                    <div className="medio-item">
                                      <div
                                        className="video-thumbnail-registro"
                                        onClick={() => setMediaPreview({ tipo: "video", url: registro.videourl! })}
                                        title="Clic para ver en grande"
                                      >
                                        <video src={registro.videourl} muted />
                                        <div className="video-play-overlay-registro">
                                          <svg viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M8 5v14l11-7z" />
                                          </svg>
                                        </div>
                                      </div>
                                      <span className="medio-label">Video</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de confirmacion para eliminar */}
      {confirmandoEliminar && (
        <div className="modal-overlay" onClick={() => !eliminando && setConfirmandoEliminar(null)}>
          <div className="modal-content modal-eliminar" onClick={(e) => e.stopPropagation()}>
            <h2>Eliminar registro</h2>
            <p>
              ¿Está seguro que desea eliminar el registro <strong>#{confirmandoEliminar.id}</strong>?
            </p>
            <p className="modal-warning">Esta acción no se puede deshacer.</p>
            <div className="modal-acciones">
              <button
                className="btn-cancelar"
                onClick={() => setConfirmandoEliminar(null)}
                disabled={eliminando}
              >
                Cancelar
              </button>
              <button
                className="btn-confirmar-eliminar"
                onClick={eliminarRegistro}
                disabled={eliminando}
              >
                {eliminando ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Previsualizacion de Medios */}
      {mediaPreview && (
        <div className="modal-overlay modal-media-overlay" onClick={() => setMediaPreview(null)}>
          <div className="modal-media-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-media-close" onClick={() => setMediaPreview(null)}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
            {mediaPreview.tipo === "imagen" ? (
              <img src={mediaPreview.url} alt="Previsualización" className="media-preview-full" />
            ) : (
              <video src={mediaPreview.url} controls autoPlay className="media-preview-full" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
