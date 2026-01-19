"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Club {
  id: number;
  nombre: string;
  telefonocaso: string | null;
}

export default function ClubesPage() {
  const [clubes, setClubes] = useState<Club[]>([]);
  const [clubesFiltrados, setClubesFiltrados] = useState<Club[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  // Filtros
  const [filtroNombre, setFiltroNombre] = useState("");

  // Panel lateral
  const [panelAbierto, setPanelAbierto] = useState(false);
  const [clubEditando, setClubEditando] = useState<Club | null>(null);
  const [formData, setFormData] = useState({
    nombre: "",
  });
  const [errorForm, setErrorForm] = useState<string | null>(null);

  // Confirmación eliminar
  const [confirmandoEliminar, setConfirmandoEliminar] = useState<Club | null>(null);

  // Mensaje
  const [mensaje, setMensaje] = useState<string | null>(null);

  useEffect(() => {
    fetchClubes();
  }, []);

  useEffect(() => {
    aplicarFiltros();
  }, [clubes, filtroNombre]);

  const fetchClubes = async () => {
    try {
      setCargando(true);
      const res = await fetch("/api/clubes");
      if (!res.ok) {
        if (res.status === 403) {
          setError("No tiene acceso al módulo de clubes");
          return;
        }
        throw new Error("Error al cargar clubes");
      }
      const data = await res.json();
      setClubes(data);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los clubes");
    } finally {
      setCargando(false);
    }
  };

  const aplicarFiltros = () => {
    let resultado = [...clubes];

    if (filtroNombre.trim()) {
      const texto = filtroNombre.toLowerCase();
      resultado = resultado.filter((c) =>
        c.nombre.toLowerCase().includes(texto)
      );
    }

    setClubesFiltrados(resultado);
  };

  const limpiarFiltros = () => {
    setFiltroNombre("");
  };

  const mostrarMensaje = (msg: string) => {
    setMensaje(msg);
    setTimeout(() => setMensaje(null), 3000);
  };

  // Abrir panel para crear
  const abrirPanelCrear = () => {
    setClubEditando(null);
    setFormData({
      nombre: "",
    });
    setErrorForm(null);
    setPanelAbierto(true);
  };

  // Abrir panel para editar
  const abrirPanelEditar = (club: Club) => {
    setClubEditando(club);
    setFormData({
      nombre: club.nombre,
    });
    setErrorForm(null);
    setPanelAbierto(true);
  };

  // Cerrar panel
  const cerrarPanel = () => {
    setPanelAbierto(false);
    setClubEditando(null);
    setErrorForm(null);
  };

  // Guardar club
  const guardarClub = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setErrorForm(null);

    try {
      const url = clubEditando
        ? `/api/clubes/${clubEditando.id}`
        : "/api/clubes";
      const method = clubEditando ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorForm(data.error || "Error al guardar");
        return;
      }

      cerrarPanel();
      fetchClubes();
      mostrarMensaje(clubEditando ? "Club actualizado" : "Club creado");
    } catch {
      setErrorForm("Error de conexión");
    } finally {
      setGuardando(false);
    }
  };

  // Eliminar club
  const eliminarClub = async () => {
    if (!confirmandoEliminar) return;
    setGuardando(true);

    try {
      const res = await fetch(`/api/clubes/${confirmandoEliminar.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setConfirmandoEliminar(null);
        fetchClubes();
        mostrarMensaje("Club eliminado");
      } else {
        const data = await res.json();
        alert(data.error || "Error al eliminar");
      }
    } catch {
      alert("Error de conexión");
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <div className="tarifas-page">
        <div className="tarifas-loading">
          <div className="loading-spinner"></div>
          <p>Cargando clubes...</p>
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
      {/* Mensaje flotante */}
      {mensaje && <div className="mensaje-flotante">{mensaje}</div>}

      {/* Header */}
      <div className="tarifas-header">
        <div className="tarifas-header-left">
          <Link href="/" className="tarifas-back-btn">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
            </svg>
          </Link>
          <h1>Clubes</h1>
        </div>
        <div className="tarifas-header-right">
          <span className="tarifas-count">
            {clubesFiltrados.length} de {clubes.length} clubes
          </span>
          <button className="refresh-btn" onClick={fetchClubes} title="Actualizar">
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
            <label>Buscar por nombre</label>
            <input
              type="text"
              placeholder="Buscar club..."
              value={filtroNombre}
              onChange={(e) => setFiltroNombre(e.target.value)}
            />
          </div>

          <div className="filtro-grupo filtro-acciones">
            <button className="btn-limpiar" onClick={limpiarFiltros}>
              Limpiar filtros
            </button>
            <button className="btn-crear-tarifa" onClick={abrirPanelCrear}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
              </svg>
              Nuevo club
            </button>
          </div>
        </div>
      </div>

      {/* Contenedor principal con tabla y panel */}
      <div className="tarifas-contenedor-principal">
        {/* Tabla */}
        <div className={`tarifas-tabla-container ${panelAbierto ? 'con-panel' : ''}`}>
          <table className="tarifas-tabla">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clubesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={3} className="tabla-vacia">
                    No se encontraron clubes
                  </td>
                </tr>
              ) : (
                clubesFiltrados.map((club) => (
                  <tr key={club.id} className={clubEditando?.id === club.id ? 'fila-seleccionada' : ''}>
                    <td className="col-id">{club.id}</td>
                    <td>{club.nombre}</td>
                    <td className="col-acciones">
                      <button
                        className="btn-accion editar"
                        onClick={() => abrirPanelEditar(club)}
                        title="Editar"
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                        </svg>
                      </button>
                      <button
                        className="btn-accion eliminar"
                        onClick={() => setConfirmandoEliminar(club)}
                        title="Eliminar"
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Panel lateral para crear/editar */}
        <div className={`tarifas-panel-lateral ${panelAbierto ? 'abierto' : ''}`}>
          <div className="panel-header">
            <h2>{clubEditando ? "Editar club" : "Nuevo club"}</h2>
            <button onClick={cerrarPanel} className="panel-close">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          </div>

          <form onSubmit={guardarClub} className="panel-form">
            {errorForm && (
              <div className="panel-error">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                </svg>
                <span>{errorForm}</span>
              </div>
            )}

            <div className="panel-field">
              <label>Nombre del club *</label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Nombre del club"
                required
              />
            </div>

            <div className="panel-actions">
              <button type="button" onClick={cerrarPanel} className="btn-cancelar">
                Cancelar
              </button>
              <button type="submit" className="btn-guardar" disabled={guardando}>
                {guardando ? (
                  <>
                    <div className="btn-spinner"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z" />
                    </svg>
                    {clubEditando ? "Guardar cambios" : "Crear club"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Confirmación eliminar inline */}
      {confirmandoEliminar && (
        <div className="tarifas-confirmar-eliminar">
          <div className="confirmar-contenido">
            <svg viewBox="0 0 24 24" fill="currentColor" className="icono-warning">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
            <div className="confirmar-texto">
              <p>¿Eliminar el club <strong>{confirmandoEliminar.nombre}</strong>?</p>
              <span className="warning-text">Esta acción no se puede deshacer.</span>
            </div>
            <div className="confirmar-botones">
              <button onClick={() => setConfirmandoEliminar(null)} className="btn-cancelar-sm">
                Cancelar
              </button>
              <button onClick={eliminarClub} className="btn-eliminar-sm" disabled={guardando}>
                {guardando ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
