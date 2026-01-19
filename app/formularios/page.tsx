"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Formulario {
  id: number;
  telefono: string;
  nombre: string | null;
  cuenta: string | null;
  tiposolicitud: string | null;
  cantidadfondos: number | null;
  cuentatransferencia: string | null;
  datosconversion: Record<string, unknown> | null;
  guid: string | null;
  club: string | null;
  enlace: string | null;
  urlimagen: string | null;
  bancodeposito: string | null;
}

export default function FormulariosPage() {
  const [formularios, setFormularios] = useState<Formulario[]>([]);
  const [formulariosFiltrados, setFormulariosFiltrados] = useState<Formulario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [filtroBusqueda, setFiltroBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");

  // Tipos de solicitud únicos
  const [tiposSolicitud, setTiposSolicitud] = useState<string[]>([]);

  // Modal de detalle
  const [formularioDetalle, setFormularioDetalle] = useState<Formulario | null>(null);

  useEffect(() => {
    fetchFormularios();
  }, []);

  useEffect(() => {
    aplicarFiltros();
  }, [formularios, filtroBusqueda, filtroTipo]);

  const fetchFormularios = async () => {
    try {
      setCargando(true);
      const res = await fetch("/api/formularios");
      if (!res.ok) {
        if (res.status === 403) {
          setError("No tiene acceso al módulo de formularios");
          return;
        }
        throw new Error("Error al cargar formularios");
      }
      const data = await res.json();
      setFormularios(data);

      // Extraer tipos de solicitud únicos
      const tipos = [...new Set(data.map((f: Formulario) => f.tiposolicitud).filter(Boolean))] as string[];
      setTiposSolicitud(tipos);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los formularios");
    } finally {
      setCargando(false);
    }
  };

  const aplicarFiltros = () => {
    let resultado = [...formularios];

    if (filtroBusqueda.trim()) {
      const texto = filtroBusqueda.toLowerCase();
      resultado = resultado.filter((f) =>
        f.telefono?.toLowerCase().includes(texto) ||
        f.nombre?.toLowerCase().includes(texto) ||
        f.cuenta?.toLowerCase().includes(texto) ||
        f.club?.toLowerCase().includes(texto)
      );
    }

    if (filtroTipo) {
      resultado = resultado.filter((f) => f.tiposolicitud === filtroTipo);
    }

    setFormulariosFiltrados(resultado);
  };

  const limpiarFiltros = () => {
    setFiltroBusqueda("");
    setFiltroTipo("");
  };

  const formatearMonto = (monto: number | null) => {
    if (monto === null) return "-";
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(monto);
  };

  if (cargando) {
    return (
      <div className="tarifas-page">
        <div className="tarifas-loading">
          <div className="loading-spinner"></div>
          <p>Cargando formularios...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tarifas-page">
        <div className="tarifas-error">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
          <p>{error}</p>
          <Link href="/" className="btn-volver-inicio">Volver al inicio</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="tarifas-page">
      {/* Header */}
      <div className="tarifas-header">
        <div className="tarifas-header-left">
          <Link href="/" className="tarifas-back-btn">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
            </svg>
          </Link>
          <h1>Formularios</h1>
        </div>
        <div className="tarifas-header-right">
          <span className="tarifas-count">
            {formulariosFiltrados.length} de {formularios.length} registros
          </span>
          <button className="refresh-btn" onClick={fetchFormularios} title="Actualizar">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="tarifas-filtros">
        <div className="filtros-row">
          <div className="filtro-grupo">
            <label>Buscar</label>
            <input
              type="text"
              placeholder="Teléfono, nombre, cuenta o club..."
              value={filtroBusqueda}
              onChange={(e) => setFiltroBusqueda(e.target.value)}
            />
          </div>

          <div className="filtro-grupo">
            <label>Tipo de solicitud</label>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
            >
              <option value="">Todos</option>
              {tiposSolicitud.map((tipo) => (
                <option key={tipo} value={tipo}>{tipo}</option>
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
      <div className="tarifas-contenedor-principal">
        <div className="tarifas-tabla-container">
          <table className="tarifas-tabla">
            <thead>
              <tr>
                <th>ID</th>
                <th>Teléfono</th>
                <th>Nombre</th>
                <th>Cuenta</th>
                <th>Tipo Solicitud</th>
                <th>Monto</th>
                <th>Club</th>
                <th>Banco</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {formulariosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={9} className="tabla-vacia">
                    No se encontraron formularios
                  </td>
                </tr>
              ) : (
                formulariosFiltrados.map((form) => (
                  <tr key={form.id}>
                    <td className="col-id">{form.id}</td>
                    <td>{form.telefono}</td>
                    <td>{form.nombre || "-"}</td>
                    <td>{form.cuenta || "-"}</td>
                    <td>
                      <span className={`badge-tipo ${form.tiposolicitud?.toLowerCase().replace(/\s+/g, '-') || ''}`}>
                        {form.tiposolicitud || "-"}
                      </span>
                    </td>
                    <td className="col-monto">{formatearMonto(form.cantidadfondos)}</td>
                    <td>{form.club || "-"}</td>
                    <td>{form.bancodeposito || "-"}</td>
                    <td className="col-acciones">
                      <button
                        className="btn-accion ver"
                        onClick={() => setFormularioDetalle(form)}
                        title="Ver detalle"
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                        </svg>
                      </button>
                      {form.urlimagen && (
                        <a
                          href={form.urlimagen}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-accion imagen"
                          title="Ver comprobante"
                        >
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                          </svg>
                        </a>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de detalle */}
      {formularioDetalle && (
        <div className="modal-overlay" onClick={() => setFormularioDetalle(null)}>
          <div className="modal-contenido" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Detalle del Formulario #{formularioDetalle.id}</h2>
              <button onClick={() => setFormularioDetalle(null)} className="modal-close">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            </div>

            <div className="modal-body">
              <div className="detalle-grid">
                <div className="detalle-campo">
                  <label>Teléfono</label>
                  <span>{formularioDetalle.telefono}</span>
                </div>
                <div className="detalle-campo">
                  <label>Nombre</label>
                  <span>{formularioDetalle.nombre || "-"}</span>
                </div>
                <div className="detalle-campo">
                  <label>Cuenta</label>
                  <span>{formularioDetalle.cuenta || "-"}</span>
                </div>
                <div className="detalle-campo">
                  <label>Tipo de Solicitud</label>
                  <span className={`badge-tipo ${formularioDetalle.tiposolicitud?.toLowerCase().replace(/\s+/g, '-') || ''}`}>
                    {formularioDetalle.tiposolicitud || "-"}
                  </span>
                </div>
                <div className="detalle-campo">
                  <label>Cantidad de Fondos</label>
                  <span className="monto">{formatearMonto(formularioDetalle.cantidadfondos)}</span>
                </div>
                <div className="detalle-campo">
                  <label>Cuenta Transferencia</label>
                  <span>{formularioDetalle.cuentatransferencia || "-"}</span>
                </div>
                <div className="detalle-campo">
                  <label>Club</label>
                  <span>{formularioDetalle.club || "-"}</span>
                </div>
                <div className="detalle-campo">
                  <label>Banco Depósito</label>
                  <span>{formularioDetalle.bancodeposito || "-"}</span>
                </div>
                <div className="detalle-campo">
                  <label>GUID</label>
                  <span className="guid">{formularioDetalle.guid || "-"}</span>
                </div>
              </div>

              {formularioDetalle.datosconversion && Object.keys(formularioDetalle.datosconversion).length > 0 && (
                <div className="detalle-seccion">
                  <h3>Datos de Conversión</h3>
                  <pre className="json-preview">
                    {JSON.stringify(formularioDetalle.datosconversion, null, 2)}
                  </pre>
                </div>
              )}

              {formularioDetalle.urlimagen && (
                <div className="detalle-seccion">
                  <h3>Comprobante</h3>
                  <a
                    href={formularioDetalle.urlimagen}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-ver-imagen"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                    </svg>
                    Ver comprobante
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-contenido {
          background: var(--bg-secondary, #1a1a2e);
          border-radius: 12px;
          max-width: 600px;
          width: 100%;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid var(--border-color, #2d2d44);
        }

        .modal-header h2 {
          margin: 0;
          font-size: 1.25rem;
          color: var(--text-primary, #000000);
        }

        .modal-close {
          background: none;
          border: none;
          color: var(--text-secondary, #888);
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .modal-close:hover {
          background: var(--bg-tertiary, #252540);
          color: var(--text-primary, #fff);
        }

        .modal-close svg {
          width: 24px;
          height: 24px;
        }

        .modal-body {
          padding: 20px;
        }

        .detalle-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        .detalle-campo {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .detalle-campo label {
          font-size: 0.75rem;
          color: var(--text-secondary, #888);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .detalle-campo span {
          color: var(--text-primary, #fff);
          font-size: 0.95rem;
        }

        .detalle-campo .monto {
          font-weight: 600;
          color: var(--accent-color, #4ade80);
        }

        .detalle-campo .guid {
          font-family: monospace;
          font-size: 0.85rem;
          word-break: break-all;
        }

        .detalle-seccion {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid var(--border-color, #2d2d44);
        }

        .detalle-seccion h3 {
          margin: 0 0 12px 0;
          font-size: 0.9rem;
          color: var(--text-secondary, #888);
        }

        .json-preview {
          background: var(--bg-tertiary, #252540);
          padding: 12px;
          border-radius: 8px;
          font-size: 0.85rem;
          overflow-x: auto;
          color: var(--text-primary, #fff);
          margin: 0;
        }

        .btn-ver-imagen {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: var(--accent-color, #6366f1);
          color: white;
          border-radius: 8px;
          text-decoration: none;
          font-size: 0.9rem;
          transition: all 0.2s;
        }

        .btn-ver-imagen:hover {
          background: var(--accent-hover, #4f46e5);
        }

        .btn-ver-imagen svg {
          width: 20px;
          height: 20px;
        }

        .badge-tipo {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.8rem;
          background: var(--bg-tertiary, #252540);
          color: var(--text-primary, #fff);
        }

        .btn-accion.ver {
          color: var(--accent-color, #6366f1);
        }

        .btn-accion.ver:hover {
          background: rgba(99, 102, 241, 0.1);
        }

        .btn-accion.imagen {
          color: var(--success-color, #4ade80);
        }

        .btn-accion.imagen:hover {
          background: rgba(74, 222, 128, 0.1);
        }

        .col-monto {
          font-weight: 500;
          text-align: right;
        }

        @media (max-width: 640px) {
          .detalle-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
