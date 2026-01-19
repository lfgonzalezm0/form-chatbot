"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Banco {
  id: number;
  nombre: string;
  numerocuenta: string;
  tipocuenta: string;
  identificacion: string;
  correo: string | null;
  telefono: string | null;
  creado: string;
  modificado: string;
}

export default function BancosPage() {
  const [bancos, setBancos] = useState<Banco[]>([]);
  const [bancosFiltrados, setBancosFiltrados] = useState<Banco[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  // Filtros
  const [filtroNombre, setFiltroNombre] = useState("");

  // Panel lateral
  const [panelAbierto, setPanelAbierto] = useState(false);
  const [bancoEditando, setBancoEditando] = useState<Banco | null>(null);
  const [formData, setFormData] = useState({
    nombre: "",
    numerocuenta: "",
    tipocuenta: "",
    identificacion: "",
    correo: "",
    telefono: "",
  });
  const [errorForm, setErrorForm] = useState<string | null>(null);

  // Confirmacion eliminar
  const [confirmandoEliminar, setConfirmandoEliminar] = useState<Banco | null>(null);

  // Mensaje
  const [mensaje, setMensaje] = useState<string | null>(null);

  useEffect(() => {
    fetchBancos();
  }, []);

  useEffect(() => {
    aplicarFiltros();
  }, [bancos, filtroNombre]);

  const fetchBancos = async () => {
    try {
      setCargando(true);
      const res = await fetch("/api/bancos");
      if (!res.ok) {
        if (res.status === 403) {
          setError("No tiene acceso al módulo de bancos");
          return;
        }
        throw new Error("Error al cargar bancos");
      }
      const data = await res.json();
      setBancos(data);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los bancos");
    } finally {
      setCargando(false);
    }
  };

  const aplicarFiltros = () => {
    let resultado = [...bancos];

    if (filtroNombre.trim()) {
      const texto = filtroNombre.toLowerCase();
      resultado = resultado.filter((b) =>
        b.nombre.toLowerCase().includes(texto) ||
        b.numerocuenta.toLowerCase().includes(texto) ||
        b.identificacion.toLowerCase().includes(texto)
      );
    }

    setBancosFiltrados(resultado);
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
    setBancoEditando(null);
    setFormData({
      nombre: "",
      numerocuenta: "",
      tipocuenta: "",
      identificacion: "",
      correo: "",
      telefono: "",
    });
    setErrorForm(null);
    setPanelAbierto(true);
  };

  // Abrir panel para editar
  const abrirPanelEditar = (banco: Banco) => {
    setBancoEditando(banco);
    setFormData({
      nombre: banco.nombre,
      numerocuenta: banco.numerocuenta,
      tipocuenta: banco.tipocuenta,
      identificacion: banco.identificacion,
      correo: banco.correo || "",
      telefono: banco.telefono || "",
    });
    setErrorForm(null);
    setPanelAbierto(true);
  };

  // Cerrar panel
  const cerrarPanel = () => {
    setPanelAbierto(false);
    setBancoEditando(null);
    setErrorForm(null);
  };

  // Guardar banco
  const guardarBanco = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setErrorForm(null);

    try {
      const url = bancoEditando
        ? `/api/bancos/${bancoEditando.id}`
        : "/api/bancos";
      const method = bancoEditando ? "PUT" : "POST";

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
      fetchBancos();
      mostrarMensaje(bancoEditando ? "Banco actualizado" : "Banco creado");
    } catch {
      setErrorForm("Error de conexión");
    } finally {
      setGuardando(false);
    }
  };

  // Eliminar banco
  const eliminarBanco = async () => {
    if (!confirmandoEliminar) return;
    setGuardando(true);

    try {
      const res = await fetch(`/api/bancos/${confirmandoEliminar.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setConfirmandoEliminar(null);
        fetchBancos();
        mostrarMensaje("Banco eliminado");
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
          <p>Cargando bancos...</p>
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
          <h1>Bancos</h1>
        </div>
        <div className="tarifas-header-right">
          <span className="tarifas-count">
            {bancosFiltrados.length} de {bancos.length} bancos
          </span>
          <button className="refresh-btn" onClick={fetchBancos} title="Actualizar">
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
              placeholder="Buscar por nombre, cuenta o identificación..."
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
              Nuevo banco
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
                <th>Número Cuenta</th>
                <th>Tipo Cuenta</th>
                <th>Identificación</th>
                <th>Correo</th>
                <th>Teléfono</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {bancosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={8} className="tabla-vacia">
                    No se encontraron bancos
                  </td>
                </tr>
              ) : (
                bancosFiltrados.map((banco) => (
                  <tr key={banco.id} className={bancoEditando?.id === banco.id ? 'fila-seleccionada' : ''}>
                    <td className="col-id">{banco.id}</td>
                    <td>{banco.nombre}</td>
                    <td>{banco.numerocuenta}</td>
                    <td>{banco.tipocuenta}</td>
                    <td>{banco.identificacion}</td>
                    <td>{banco.correo || "-"}</td>
                    <td>{banco.telefono || "-"}</td>
                    <td className="col-acciones">
                      <button
                        className="btn-accion editar"
                        onClick={() => abrirPanelEditar(banco)}
                        title="Editar"
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                        </svg>
                      </button>
                      <button
                        className="btn-accion eliminar"
                        onClick={() => setConfirmandoEliminar(banco)}
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
            <h2>{bancoEditando ? "Editar banco" : "Nuevo banco"}</h2>
            <button onClick={cerrarPanel} className="panel-close">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          </div>

          <form onSubmit={guardarBanco} className="panel-form">
            {errorForm && (
              <div className="panel-error">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                </svg>
                <span>{errorForm}</span>
              </div>
            )}

            <div className="panel-field">
              <label>Nombre del banco *</label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Ej: Banco Nacional"
                required
              />
            </div>

            <div className="panel-field">
              <label>Número de cuenta *</label>
              <input
                type="text"
                value={formData.numerocuenta}
                onChange={(e) => setFormData({ ...formData, numerocuenta: e.target.value })}
                placeholder="Ej: 1234567890"
                required
              />
            </div>

            <div className="panel-field">
              <label>Tipo de cuenta *</label>
              <select
                value={formData.tipocuenta}
                onChange={(e) => setFormData({ ...formData, tipocuenta: e.target.value })}
                required
              >
                <option value="">Seleccionar...</option>
                <option value="Ahorros">Ahorros</option>
                <option value="Corriente">Corriente</option>
              </select>
            </div>

            <div className="panel-field">
              <label>Identificación *</label>
              <input
                type="text"
                value={formData.identificacion}
                onChange={(e) => setFormData({ ...formData, identificacion: e.target.value })}
                placeholder="Ej: 123456789"
                required
              />
            </div>

            <div className="panel-field">
              <label>Correo</label>
              <input
                type="email"
                value={formData.correo}
                onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                placeholder="correo@ejemplo.com"
              />
            </div>

            <div className="panel-field">
              <label>Teléfono</label>
              <input
                type="text"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                placeholder="Ej: 3001234567"
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
                    {bancoEditando ? "Guardar cambios" : "Crear banco"}
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
              <p>¿Eliminar el banco <strong>{confirmandoEliminar.nombre}</strong>?</p>
              <span className="warning-text">Esta acción no se puede deshacer.</span>
            </div>
            <div className="confirmar-botones">
              <button onClick={() => setConfirmandoEliminar(null)} className="btn-cancelar-sm">
                Cancelar
              </button>
              <button onClick={eliminarBanco} className="btn-eliminar-sm" disabled={guardando}>
                {guardando ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
