"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Tarifa {
  id: number;
  origen: string;
  destino: string;
  ciudad_destino: string;
  precio: number;
}

export default function TarifasPage() {
  const [tarifas, setTarifas] = useState<Tarifa[]>([]);
  const [tarifasFiltradas, setTarifasFiltradas] = useState<Tarifa[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  // Filtros
  const [filtroOrigen, setFiltroOrigen] = useState("");
  const [filtroDestino, setFiltroDestino] = useState("");
  const [filtroCiudad, setFiltroCiudad] = useState("todas");

  // Modal
  const [modalAbierto, setModalAbierto] = useState(false);
  const [tarifaEditando, setTarifaEditando] = useState<Tarifa | null>(null);
  const [formData, setFormData] = useState({
    origen: "",
    destino: "",
    ciudad_destino: "",
    precio: "",
  });
  const [errorForm, setErrorForm] = useState<string | null>(null);

  // Confirmación eliminar
  const [confirmandoEliminar, setConfirmandoEliminar] = useState<Tarifa | null>(null);

  // Mensaje
  const [mensaje, setMensaje] = useState<string | null>(null);

  useEffect(() => {
    fetchTarifas();
  }, []);

  useEffect(() => {
    aplicarFiltros();
  }, [tarifas, filtroOrigen, filtroDestino, filtroCiudad]);

  const fetchTarifas = async () => {
    try {
      setCargando(true);
      const res = await fetch("/api/tarifas");
      if (!res.ok) {
        if (res.status === 403) {
          setError("No tiene acceso al módulo de tarifas");
          return;
        }
        throw new Error("Error al cargar tarifas");
      }
      const data = await res.json();
      setTarifas(data);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar las tarifas");
    } finally {
      setCargando(false);
    }
  };

  const aplicarFiltros = () => {
    let resultado = [...tarifas];

    if (filtroOrigen.trim()) {
      const texto = filtroOrigen.toLowerCase();
      resultado = resultado.filter((t) =>
        t.origen.toLowerCase().includes(texto)
      );
    }

    if (filtroDestino.trim()) {
      const texto = filtroDestino.toLowerCase();
      resultado = resultado.filter((t) =>
        t.destino.toLowerCase().includes(texto)
      );
    }

    if (filtroCiudad !== "todas") {
      resultado = resultado.filter((t) => t.ciudad_destino === filtroCiudad);
    }

    setTarifasFiltradas(resultado);
  };

  const limpiarFiltros = () => {
    setFiltroOrigen("");
    setFiltroDestino("");
    setFiltroCiudad("todas");
  };

  const mostrarMensaje = (msg: string) => {
    setMensaje(msg);
    setTimeout(() => setMensaje(null), 3000);
  };

  // Obtener ciudades únicas
  const ciudadesUnicas = [...new Set(tarifas.map((t) => t.ciudad_destino))].sort();

  // Abrir modal para crear
  const abrirModalCrear = () => {
    setTarifaEditando(null);
    setFormData({
      origen: "",
      destino: "",
      ciudad_destino: "",
      precio: "",
    });
    setErrorForm(null);
    setModalAbierto(true);
  };

  // Abrir modal para editar
  const abrirModalEditar = (tarifa: Tarifa) => {
    setTarifaEditando(tarifa);
    setFormData({
      origen: tarifa.origen,
      destino: tarifa.destino,
      ciudad_destino: tarifa.ciudad_destino,
      precio: tarifa.precio.toString(),
    });
    setErrorForm(null);
    setModalAbierto(true);
  };

  // Guardar tarifa
  const guardarTarifa = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setErrorForm(null);

    try {
      const url = tarifaEditando
        ? `/api/tarifas/${tarifaEditando.id}`
        : "/api/tarifas";
      const method = tarifaEditando ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          precio: parseFloat(formData.precio),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorForm(data.error || "Error al guardar");
        return;
      }

      setModalAbierto(false);
      fetchTarifas();
      mostrarMensaje(tarifaEditando ? "Tarifa actualizada" : "Tarifa creada");
    } catch {
      setErrorForm("Error de conexión");
    } finally {
      setGuardando(false);
    }
  };

  // Eliminar tarifa
  const eliminarTarifa = async () => {
    if (!confirmandoEliminar) return;
    setGuardando(true);

    try {
      const res = await fetch(`/api/tarifas/${confirmandoEliminar.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setConfirmandoEliminar(null);
        fetchTarifas();
        mostrarMensaje("Tarifa eliminada");
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
          <p>Cargando tarifas...</p>
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
          <h1>Tarifas de Transporte</h1>
        </div>
        <div className="tarifas-header-right">
          <span className="tarifas-count">
            {tarifasFiltradas.length} de {tarifas.length} tarifas
          </span>
          <button className="refresh-btn" onClick={fetchTarifas} title="Actualizar">
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
            <label>Buscar origen</label>
            <input
              type="text"
              placeholder="Ej: Cumbaya, Quitumbe..."
              value={filtroOrigen}
              onChange={(e) => setFiltroOrigen(e.target.value)}
            />
          </div>

          <div className="filtro-grupo">
            <label>Buscar destino</label>
            <input
              type="text"
              placeholder="Ej: Centro de Ibarra..."
              value={filtroDestino}
              onChange={(e) => setFiltroDestino(e.target.value)}
            />
          </div>

          <div className="filtro-grupo">
            <label>Ciudad destino</label>
            <select value={filtroCiudad} onChange={(e) => setFiltroCiudad(e.target.value)}>
              <option value="todas">Todas las ciudades</option>
              {ciudadesUnicas.map((ciudad) => (
                <option key={ciudad} value={ciudad}>
                  {ciudad}
                </option>
              ))}
            </select>
          </div>

          <div className="filtro-grupo filtro-acciones">
            <button className="btn-limpiar" onClick={limpiarFiltros}>
              Limpiar filtros
            </button>
            <button className="btn-crear-tarifa" onClick={abrirModalCrear}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
              </svg>
              Nueva tarifa
            </button>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="tarifas-tabla-container">
        <table className="tarifas-tabla">
          <thead>
            <tr>
              <th>ID</th>
              <th>Origen</th>
              <th>Destino</th>
              <th>Ciudad Destino</th>
              <th>Precio</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {tarifasFiltradas.length === 0 ? (
              <tr>
                <td colSpan={6} className="tabla-vacia">
                  No se encontraron tarifas
                </td>
              </tr>
            ) : (
              tarifasFiltradas.map((tarifa) => (
                <tr key={tarifa.id}>
                  <td className="col-id">{tarifa.id}</td>
                  <td>{tarifa.origen}</td>
                  <td>{tarifa.destino}</td>
                  <td>
                    <span className="badge-ciudad">{tarifa.ciudad_destino}</span>
                  </td>
                  <td className="col-precio">${Number(tarifa.precio).toFixed(2)}</td>
                  <td className="col-acciones">
                    <button
                      className="btn-accion editar"
                      onClick={() => abrirModalEditar(tarifa)}
                      title="Editar"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                      </svg>
                    </button>
                    <button
                      className="btn-accion eliminar"
                      onClick={() => setConfirmandoEliminar(tarifa)}
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

      {/* Modal crear/editar */}
      {modalAbierto && (
        <div className="modal-overlay" onClick={() => setModalAbierto(false)}>
          <div className="modal-content modal-tarifa" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{tarifaEditando ? "Editar tarifa" : "Nueva tarifa"}</h2>
              <button onClick={() => setModalAbierto(false)} className="modal-close">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            </div>

            <form onSubmit={guardarTarifa} className="modal-form">
              {errorForm && (
                <div className="modal-error">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                  </svg>
                  <span>{errorForm}</span>
                </div>
              )}

              <div className="form-field">
                <label>Origen *</label>
                <input
                  type="text"
                  value={formData.origen}
                  onChange={(e) => setFormData({ ...formData, origen: e.target.value })}
                  placeholder="Ej: Norte de Quito"
                  required
                />
              </div>

              <div className="form-field">
                <label>Destino *</label>
                <input
                  type="text"
                  value={formData.destino}
                  onChange={(e) => setFormData({ ...formData, destino: e.target.value })}
                  placeholder="Ej: Sector centro de Ibarra"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label>Ciudad destino *</label>
                  <input
                    type="text"
                    value={formData.ciudad_destino}
                    onChange={(e) => setFormData({ ...formData, ciudad_destino: e.target.value })}
                    placeholder="Ej: Ibarra"
                    required
                    list="ciudades-lista"
                  />
                  <datalist id="ciudades-lista">
                    {ciudadesUnicas.map((ciudad) => (
                      <option key={ciudad} value={ciudad} />
                    ))}
                  </datalist>
                </div>

                <div className="form-field">
                  <label>Precio ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.precio}
                    onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                    placeholder="Ej: 25.00"
                    required
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setModalAbierto(false)} className="btn-cancelar">
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
                      {tarifaEditando ? "Guardar cambios" : "Crear tarifa"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal confirmar eliminar */}
      {confirmandoEliminar && (
        <div className="modal-overlay" onClick={() => setConfirmandoEliminar(null)}>
          <div className="modal-content modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header danger">
              <h2>Eliminar tarifa</h2>
              <button onClick={() => setConfirmandoEliminar(null)} className="modal-close">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            </div>

            <div className="modal-body">
              <p>¿Está seguro que desea eliminar la tarifa de <strong>{confirmandoEliminar.origen}</strong> a <strong>{confirmandoEliminar.destino}</strong>?</p>
              <p className="warning-text">Esta acción no se puede deshacer.</p>
            </div>

            <div className="modal-actions">
              <button onClick={() => setConfirmandoEliminar(null)} className="btn-cancelar">
                Cancelar
              </button>
              <button onClick={eliminarTarifa} className="btn-eliminar" disabled={guardando}>
                {guardando ? (
                  <>
                    <div className="btn-spinner"></div>
                    Eliminando...
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                    </svg>
                    Eliminar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
