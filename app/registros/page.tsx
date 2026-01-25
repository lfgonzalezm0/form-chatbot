"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Registro {
  id: number;
  telefonocaso: string | null;
  categoria: string | null;
  necesidad: string | null;
  pregunta: string | null;
  respuesta: string | null;
  variante: string | null;
  urlimagen: string | null;
  videourl: string | null;
  cuenta_nombre?: string | null;
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
  const [filtroCategoria, setFiltroCategoria] = useState<string>("todos");
  const [filtroNecesidad, setFiltroNecesidad] = useState<string>("todos");

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
  }, [registros, filtroTexto, filtroCategoria, filtroNecesidad]);

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

    // Filtro de texto (busca en varios campos)
    if (filtroTexto.trim()) {
      const texto = filtroTexto.toLowerCase();
      resultado = resultado.filter(
        (r) =>
          r.telefonocaso?.toLowerCase().includes(texto) ||
          r.categoria?.toLowerCase().includes(texto) ||
          r.necesidad?.toLowerCase().includes(texto) ||
          r.pregunta?.toLowerCase().includes(texto) ||
          r.respuesta?.toLowerCase().includes(texto) ||
          r.variante?.toLowerCase().includes(texto) ||
          r.cuenta_nombre?.toLowerCase().includes(texto)
      );
    }

    // Filtro por categoria
    if (filtroCategoria !== "todos") {
      resultado = resultado.filter((r) => r.categoria === filtroCategoria);
    }

    // Filtro por necesidad
    if (filtroNecesidad !== "todos") {
      resultado = resultado.filter((r) => r.necesidad === filtroNecesidad);
    }

    setRegistrosFiltrados(resultado);
  };

  const limpiarFiltros = () => {
    setFiltroTexto("");
    setFiltroCategoria("todos");
    setFiltroNecesidad("todos");
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
  const categoriasUnicas = [...new Set(registros.map((r) => r.categoria).filter(Boolean))];
  const necesidadesUnicas = [...new Set(registros.map((r) => r.necesidad).filter(Boolean))];

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
          <h1>Registros de Preguntas</h1>
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
          <div className="filtro-grupo filtro-grupo-buscar">
            <label>Buscar</label>
            <input
              type="text"
              placeholder="Telefono, categoria, necesidad, pregunta..."
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
            />
          </div>

          <div className="filtro-grupo">
            <label>Categoria</label>
            <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}>
              <option value="todos">Todas</option>
              {categoriasUnicas.map((cat) => (
                <option key={cat} value={cat || ""}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="filtro-grupo">
            <label>Necesidad</label>
            <select value={filtroNecesidad} onChange={(e) => setFiltroNecesidad(e.target.value)}>
              <option value="todos">Todas</option>
              {necesidadesUnicas.map((nec) => (
                <option key={nec} value={nec || ""}>
                  {nec}
                </option>
              ))}
            </select>
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
              <th>Telefono</th>
              <th>Cuenta</th>
              <th>Categoria</th>
              <th>Necesidad</th>
              <th>Pregunta</th>
              <th>Respuesta</th>
              <th>Variante</th>
              <th>Medios</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {registrosFiltrados.length === 0 ? (
              <tr>
                <td colSpan={10} className="tabla-vacia">
                  No se encontraron registros
                </td>
              </tr>
            ) : (
              registrosFiltrados.map((registro) => (
                <>
                  <tr key={registro.id}>
                    <td>{registro.id}</td>
                    <td>{registro.telefonocaso || "-"}</td>
                    <td>{registro.cuenta_nombre || "-"}</td>
                    <td>
                      <span className="badge-categoria">
                        {registro.categoria || "-"}
                      </span>
                    </td>
                    <td>
                      <span className="badge-necesidad">
                        {registro.necesidad || "-"}
                      </span>
                    </td>
                    <td className="celda-texto" title={registro.pregunta || ""}>
                      {truncarTexto(registro.pregunta, 40)}
                    </td>
                    <td className="celda-texto" title={registro.respuesta || ""}>
                      {truncarTexto(registro.respuesta, 40)}
                    </td>
                    <td className="celda-texto" title={registro.variante || ""}>
                      {truncarTexto(registro.variante, 30)}
                    </td>
                    <td className="celda-medios">
                      {registro.urlimagen && (
                        <span className="badge-media badge-imagen" title="Tiene imagen">
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                          </svg>
                        </span>
                      )}
                      {registro.videourl && (
                        <span className="badge-media badge-video" title="Tiene video">
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
                          </svg>
                        </span>
                      )}
                      {!registro.urlimagen && !registro.videourl && "-"}
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
                      <td colSpan={10}>
                        <div className="detalle-contenido">
                          <div className="detalle-grid">
                            <div className="detalle-campo">
                              <strong>Telefono:</strong>
                              <span>{registro.telefonocaso || "-"}</span>
                            </div>
                            <div className="detalle-campo">
                              <strong>Cuenta:</strong>
                              <span>{registro.cuenta_nombre || "-"}</span>
                            </div>
                            <div className="detalle-campo">
                              <strong>Categoria:</strong>
                              <span>{registro.categoria || "-"}</span>
                            </div>
                            <div className="detalle-campo">
                              <strong>Necesidad:</strong>
                              <span>{registro.necesidad || "-"}</span>
                            </div>
                            <div className="detalle-campo detalle-campo-full">
                              <strong>Pregunta completa:</strong>
                              <p>{registro.pregunta || "-"}</p>
                            </div>
                            <div className="detalle-campo detalle-campo-full">
                              <strong>Respuesta completa:</strong>
                              <p>{registro.respuesta || "-"}</p>
                            </div>
                            <div className="detalle-campo detalle-campo-full">
                              <strong>Variante:</strong>
                              <p>{registro.variante || "-"}</p>
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
              Esta seguro que desea eliminar el registro <strong>#{confirmandoEliminar.id}</strong>?
            </p>
            <p className="modal-warning">Esta accion no se puede deshacer.</p>
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
              <img src={mediaPreview.url} alt="Previsualizacion" className="media-preview-full" />
            ) : (
              <video src={mediaPreview.url} controls autoPlay className="media-preview-full" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
