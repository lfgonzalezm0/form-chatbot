"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Usuario {
  id: number;
  nombre: string | null;
  telefono: string | null;
  cuenta: string | null;
  contrasena: string | null;
  proceso: string | null;
  aprobar: boolean | null;
  asignacion: string | null;
}

interface UsuarioEditando {
  id: number;
  campo: string;
  valor: string | boolean;
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [usuariosFiltrados, setUsuariosFiltrados] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  // Filtros
  const [filtroTexto, setFiltroTexto] = useState("");
  const [filtroAprobar, setFiltroAprobar] = useState<string>("todos");
  const [filtroAsignacion, setFiltroAsignacion] = useState<string>("todos");

  // Seleccion multiple
  const [seleccionados, setSeleccionados] = useState<number[]>([]);

  // Edicion inline
  const [editando, setEditando] = useState<UsuarioEditando | null>(null);
  const [valorEditando, setValorEditando] = useState<string>("");

  // Mensaje de exito
  const [mensaje, setMensaje] = useState<string | null>(null);

  useEffect(() => {
    fetchUsuarios();
  }, []);

  useEffect(() => {
    aplicarFiltros();
  }, [usuarios, filtroTexto, filtroAprobar, filtroAsignacion]);

  const fetchUsuarios = async () => {
    try {
      setCargando(true);
      const res = await fetch("/api/usuarios");
      if (!res.ok) throw new Error("Error al cargar usuarios");
      const data = await res.json();
      setUsuarios(data);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los usuarios");
    } finally {
      setCargando(false);
    }
  };

  const aplicarFiltros = () => {
    let resultado = [...usuarios];

    if (filtroTexto.trim()) {
      const texto = filtroTexto.toLowerCase();
      resultado = resultado.filter(
        (u) =>
          u.nombre?.toLowerCase().includes(texto) ||
          u.telefono?.toLowerCase().includes(texto) ||
          u.cuenta?.toLowerCase().includes(texto) ||
          u.proceso?.toLowerCase().includes(texto)
      );
    }

    if (filtroAprobar !== "todos") {
      const valor = filtroAprobar === "activar";
      resultado = resultado.filter((u) => u.aprobar === valor);
    }

    if (filtroAsignacion !== "todos") {
      resultado = resultado.filter((u) => u.asignacion === filtroAsignacion);
    }

    setUsuariosFiltrados(resultado);
  };

  const limpiarFiltros = () => {
    setFiltroTexto("");
    setFiltroAprobar("todos");
    setFiltroAsignacion("todos");
  };

  const mostrarMensaje = (msg: string) => {
    setMensaje(msg);
    setTimeout(() => setMensaje(null), 3000);
  };

  // Iniciar edicion
  const iniciarEdicion = (id: number, campo: string, valorActual: string | boolean | null) => {
    setEditando({ id, campo, valor: valorActual ?? "" });
    setValorEditando(String(valorActual ?? ""));
  };

  // Cancelar edicion
  const cancelarEdicion = () => {
    setEditando(null);
    setValorEditando("");
  };

  // Guardar edicion
  const guardarEdicion = async () => {
    if (!editando) return;

    setGuardando(true);
    try {
      const payload: Record<string, string | boolean> = {};

      if (editando.campo === "aprobar") {
        payload[editando.campo] = valorEditando === "activar";
      } else if (editando.campo === "asignacion") {
        payload[editando.campo] = valorEditando;
      } else {
        payload[editando.campo] = valorEditando;
      }

      const res = await fetch(`/api/usuarios/${editando.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Error al guardar");

      // Actualizar estado local
      setUsuarios((prev) =>
        prev.map((u) =>
          u.id === editando.id
            ? { ...u, [editando.campo]: editando.campo === "aprobar" ? valorEditando === "activar" : valorEditando }
            : u
        )
      );

      mostrarMensaje("Usuario actualizado correctamente");
      cancelarEdicion();
    } catch (err) {
      console.error(err);
      mostrarMensaje("Error al guardar cambios");
    } finally {
      setGuardando(false);
    }
  };

  // Toggle seleccion
  const toggleSeleccion = (id: number) => {
    setSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Seleccionar todos
  const toggleSeleccionarTodos = () => {
    if (seleccionados.length === usuariosFiltrados.length) {
      setSeleccionados([]);
    } else {
      setSeleccionados(usuariosFiltrados.map((u) => u.id));
    }
  };

  // Accion masiva
  const accionMasiva = async (campo: "aprobar" | "asignacion", valor: string) => {
    if (seleccionados.length === 0) {
      mostrarMensaje("Selecciona al menos un usuario");
      return;
    }

    setGuardando(true);
    try {
      const res = await fetch("/api/usuarios", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: seleccionados,
          campo,
          valor,
        }),
      });

      if (!res.ok) throw new Error("Error al actualizar");

      // Actualizar estado local
      const valorFinal = campo === "aprobar" ? valor === "activar" : valor;
      setUsuarios((prev) =>
        prev.map((u) =>
          seleccionados.includes(u.id)
            ? { ...u, [campo]: valorFinal }
            : u
        )
      );

      mostrarMensaje(`${seleccionados.length} usuarios actualizados`);
      setSeleccionados([]);
    } catch (err) {
      console.error(err);
      mostrarMensaje("Error al actualizar usuarios");
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <div className="usuarios-page">
        <div className="usuarios-loading">
          <div className="loading-spinner"></div>
          <p>Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="usuarios-page">
        <div className="usuarios-error">
          <p>{error}</p>
          <button onClick={fetchUsuarios}>Reintentar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="usuarios-page">
      {/* Mensaje flotante */}
      {mensaje && <div className="mensaje-flotante">{mensaje}</div>}

      {/* Header */}
      <div className="usuarios-header">
        <div className="usuarios-header-left">
          <Link href="/" className="usuarios-back-btn">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
            </svg>
          </Link>
          <h1>Gestion de Usuarios</h1>
        </div>
        <div className="usuarios-header-right">
          <span className="usuarios-count">
            {usuariosFiltrados.length} de {usuarios.length} usuarios
          </span>
          <button className="refresh-btn" onClick={fetchUsuarios} title="Actualizar">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="usuarios-filtros">
        <div className="filtros-row">
          <div className="filtro-grupo">
            <label>Buscar</label>
            <input
              type="text"
              placeholder="Nombre, telefono, cuenta..."
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
            />
          </div>

          <div className="filtro-grupo">
            <label>Aprobar</label>
            <select value={filtroAprobar} onChange={(e) => setFiltroAprobar(e.target.value)}>
              <option value="todos">Todos</option>
              <option value="activar">Activado</option>
              <option value="desactivar">Desactivado</option>
            </select>
          </div>

          <div className="filtro-grupo">
            <label>Asignacion</label>
            <select value={filtroAsignacion} onChange={(e) => setFiltroAsignacion(e.target.value)}>
              <option value="todos">Todos</option>
              <option value="activar">Activar</option>
              <option value="desactivar">Desactivar</option>
            </select>
          </div>

          <div className="filtro-grupo filtro-acciones">
            <button className="btn-limpiar" onClick={limpiarFiltros}>
              Limpiar filtros
            </button>
          </div>
        </div>
      </div>

      {/* Acciones masivas */}
      {seleccionados.length > 0 && (
        <div className="acciones-masivas">
          <span>{seleccionados.length} seleccionados</span>
          <div className="acciones-masivas-btns">
            <button
              className="btn-masivo activar"
              onClick={() => accionMasiva("aprobar", "activar")}
              disabled={guardando}
            >
              Activar Aprobar
            </button>
            <button
              className="btn-masivo desactivar"
              onClick={() => accionMasiva("aprobar", "desactivar")}
              disabled={guardando}
            >
              Desactivar Aprobar
            </button>
            <button
              className="btn-masivo activar"
              onClick={() => accionMasiva("asignacion", "activar")}
              disabled={guardando}
            >
              Activar Asignacion
            </button>
            <button
              className="btn-masivo desactivar"
              onClick={() => accionMasiva("asignacion", "desactivar")}
              disabled={guardando}
            >
              Desactivar Asignacion
            </button>
            <button
              className="btn-cancelar-seleccion"
              onClick={() => setSeleccionados([])}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className="usuarios-tabla-container">
        <table className="usuarios-tabla">
          <thead>
            <tr>
              <th className="col-checkbox">
                <input
                  type="checkbox"
                  checked={seleccionados.length === usuariosFiltrados.length && usuariosFiltrados.length > 0}
                  onChange={toggleSeleccionarTodos}
                />
              </th>
              <th>ID</th>
              <th>Nombre</th>
              <th>Telefono</th>
              <th>Cuenta</th>
              <th>Contrasena</th>
              <th>Proceso</th>
              <th>Aprobar</th>
              <th>Asignacion</th>
            </tr>
          </thead>
          <tbody>
            {usuariosFiltrados.length === 0 ? (
              <tr>
                <td colSpan={9} className="tabla-vacia">
                  No se encontraron usuarios
                </td>
              </tr>
            ) : (
              usuariosFiltrados.map((usuario) => (
                <tr key={usuario.id} className={seleccionados.includes(usuario.id) ? "fila-seleccionada" : ""}>
                  <td className="col-checkbox">
                    <input
                      type="checkbox"
                      checked={seleccionados.includes(usuario.id)}
                      onChange={() => toggleSeleccion(usuario.id)}
                    />
                  </td>
                  <td className="col-id">{usuario.id}</td>

                  {/* Nombre */}
                  <td
                    className="celda-editable"
                    onClick={() => iniciarEdicion(usuario.id, "nombre", usuario.nombre)}
                  >
                    {editando?.id === usuario.id && editando?.campo === "nombre" ? (
                      <div className="edicion-inline">
                        <input
                          type="text"
                          value={valorEditando}
                          onChange={(e) => setValorEditando(e.target.value)}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") guardarEdicion();
                            if (e.key === "Escape") cancelarEdicion();
                          }}
                        />
                        <button onClick={guardarEdicion} disabled={guardando} className="btn-guardar-inline">✓</button>
                        <button onClick={cancelarEdicion} className="btn-cancelar-inline">✕</button>
                      </div>
                    ) : (
                      <span>{usuario.nombre || "-"}</span>
                    )}
                  </td>

                  {/* Telefono */}
                  <td
                    className="celda-editable"
                    onClick={() => iniciarEdicion(usuario.id, "telefono", usuario.telefono)}
                  >
                    {editando?.id === usuario.id && editando?.campo === "telefono" ? (
                      <div className="edicion-inline">
                        <input
                          type="text"
                          value={valorEditando}
                          onChange={(e) => setValorEditando(e.target.value)}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") guardarEdicion();
                            if (e.key === "Escape") cancelarEdicion();
                          }}
                        />
                        <button onClick={guardarEdicion} disabled={guardando} className="btn-guardar-inline">✓</button>
                        <button onClick={cancelarEdicion} className="btn-cancelar-inline">✕</button>
                      </div>
                    ) : (
                      <span>{usuario.telefono || "-"}</span>
                    )}
                  </td>

                  {/* Cuenta */}
                  <td
                    className="celda-editable"
                    onClick={() => iniciarEdicion(usuario.id, "cuenta", usuario.cuenta)}
                  >
                    {editando?.id === usuario.id && editando?.campo === "cuenta" ? (
                      <div className="edicion-inline">
                        <input
                          type="text"
                          value={valorEditando}
                          onChange={(e) => setValorEditando(e.target.value)}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") guardarEdicion();
                            if (e.key === "Escape") cancelarEdicion();
                          }}
                        />
                        <button onClick={guardarEdicion} disabled={guardando} className="btn-guardar-inline">✓</button>
                        <button onClick={cancelarEdicion} className="btn-cancelar-inline">✕</button>
                      </div>
                    ) : (
                      <span>{usuario.cuenta || "-"}</span>
                    )}
                  </td>

                  {/* Contrasena */}
                  <td
                    className="celda-editable"
                    onClick={() => iniciarEdicion(usuario.id, "contrasena", usuario.contrasena)}
                  >
                    {editando?.id === usuario.id && editando?.campo === "contrasena" ? (
                      <div className="edicion-inline">
                        <input
                          type="text"
                          value={valorEditando}
                          onChange={(e) => setValorEditando(e.target.value)}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") guardarEdicion();
                            if (e.key === "Escape") cancelarEdicion();
                          }}
                        />
                        <button onClick={guardarEdicion} disabled={guardando} className="btn-guardar-inline">✓</button>
                        <button onClick={cancelarEdicion} className="btn-cancelar-inline">✕</button>
                      </div>
                    ) : (
                      <span className="contrasena-oculta">{usuario.contrasena ? "••••••" : "-"}</span>
                    )}
                  </td>

                  {/* Proceso */}
                  <td
                    className="celda-editable"
                    onClick={() => iniciarEdicion(usuario.id, "proceso", usuario.proceso)}
                  >
                    {editando?.id === usuario.id && editando?.campo === "proceso" ? (
                      <div className="edicion-inline">
                        <input
                          type="text"
                          value={valorEditando}
                          onChange={(e) => setValorEditando(e.target.value)}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") guardarEdicion();
                            if (e.key === "Escape") cancelarEdicion();
                          }}
                        />
                        <button onClick={guardarEdicion} disabled={guardando} className="btn-guardar-inline">✓</button>
                        <button onClick={cancelarEdicion} className="btn-cancelar-inline">✕</button>
                      </div>
                    ) : (
                      <span>{usuario.proceso || "-"}</span>
                    )}
                  </td>

                  {/* Aprobar */}
                  <td
                    className="celda-editable"
                    onClick={() => iniciarEdicion(usuario.id, "aprobar", usuario.aprobar ? "activar" : "desactivar")}
                  >
                    {editando?.id === usuario.id && editando?.campo === "aprobar" ? (
                      <div className="edicion-inline">
                        <select
                          value={valorEditando}
                          onChange={(e) => setValorEditando(e.target.value)}
                          autoFocus
                        >
                          <option value="activar">Activar</option>
                          <option value="desactivar">Desactivar</option>
                        </select>
                        <button onClick={guardarEdicion} disabled={guardando} className="btn-guardar-inline">✓</button>
                        <button onClick={cancelarEdicion} className="btn-cancelar-inline">✕</button>
                      </div>
                    ) : (
                      <span className={`badge-toggle ${usuario.aprobar ? "activado" : "desactivado"}`}>
                        {usuario.aprobar ? "Activado" : "Desactivado"}
                      </span>
                    )}
                  </td>

                  {/* Asignacion */}
                  <td
                    className="celda-editable"
                    onClick={() => iniciarEdicion(usuario.id, "asignacion", usuario.asignacion)}
                  >
                    {editando?.id === usuario.id && editando?.campo === "asignacion" ? (
                      <div className="edicion-inline">
                        <select
                          value={valorEditando}
                          onChange={(e) => setValorEditando(e.target.value)}
                          autoFocus
                        >
                          <option value="activar">Activar</option>
                          <option value="desactivar">Desactivar</option>
                        </select>
                        <button onClick={guardarEdicion} disabled={guardando} className="btn-guardar-inline">✓</button>
                        <button onClick={cancelarEdicion} className="btn-cancelar-inline">✕</button>
                      </div>
                    ) : (
                      <span className={`badge-toggle ${usuario.asignacion === "activar" ? "activado" : "desactivado"}`}>
                        {usuario.asignacion === "activar" ? "Activar" : "Desactivar"}
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
