"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "../components/AuthProvider";

interface Necesidad {
  id: number;
  telefonocaso: string | null;
  categoria: string | null;
  necesidad: string | null;
  habilitado: boolean | null;
}

interface Pregunta {
  id: number;
  telefonocaso: string | null;
  categoria: string | null;
  necesidad: string | null;
  pregunta: string | null;
  respuesta: string | null;
  variante: string | null;
  imagen: string | null;
  video: string | null;
  urlimagen: string | null;
}

const CATEGORIAS = [
  "Informacion",
  "Compra",
  "Reservas",
  "Seguimiento",
  "Soporte",
  "Pagos",
  "Autoservicio",
  "Decision",
  "Confianza",
  "Postventa",
];

export default function NecesidadesPage() {
  const { usuario } = useAuth();

  // Estado de necesidades
  const [necesidades, setNecesidades] = useState<Necesidad[]>([]);
  const [necesidadesFiltradas, setNecesidadesFiltradas] = useState<Necesidad[]>([]);
  const [necesidadSeleccionada, setNecesidadSeleccionada] = useState<Necesidad | null>(null);

  // Estado de preguntas
  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [preguntasFiltradas, setPreguntasFiltradas] = useState<Pregunta[]>([]);

  // Estados de carga
  const [cargandoNecesidades, setCargandoNecesidades] = useState(true);
  const [cargandoPreguntas, setCargandoPreguntas] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // Filtros
  const [filtroNecesidad, setFiltroNecesidad] = useState("");
  const [filtroCategoriaNecc, setFiltroCategoriaNecc] = useState("todas");
  const [filtroHabilitado, setFiltroHabilitado] = useState("todos");
  const [filtroPregunta, setFiltroPregunta] = useState("");
  const [filtroCategoriaPregunta, setFiltroCategoriaPregunta] = useState("todas");

  // Modales
  const [modalNecesidad, setModalNecesidad] = useState<"crear" | "editar" | null>(null);
  const [modalPregunta, setModalPregunta] = useState<"crear" | "editar" | null>(null);
  const [confirmandoEliminar, setConfirmandoEliminar] = useState<{ tipo: "necesidad" | "pregunta"; id: number } | null>(null);

  // Formularios
  const [formNecesidad, setFormNecesidad] = useState<Partial<Necesidad>>({});
  const [formPregunta, setFormPregunta] = useState<Partial<Pregunta>>({});
  const [variantes, setVariantes] = useState<string[]>([]);
  const [nuevaVariante, setNuevaVariante] = useState("");
  const [imagenPreview, setImagenPreview] = useState<string | null>(null);

  // Necesidad en edicion
  const [necesidadEditando, setNecesidadEditando] = useState<Necesidad | null>(null);
  const [preguntaEditando, setPreguntaEditando] = useState<Pregunta | null>(null);

  // Mensaje
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Vista movil
  const [vistaMovil, setVistaMovil] = useState<"necesidades" | "preguntas">("necesidades");

  useEffect(() => {
    fetchNecesidades();
  }, []);

  useEffect(() => {
    aplicarFiltrosNecesidades();
  }, [necesidades, filtroNecesidad, filtroCategoriaNecc, filtroHabilitado]);

  useEffect(() => {
    if (necesidadSeleccionada) {
      fetchPreguntas(necesidadSeleccionada.necesidad || "");
    } else {
      setPreguntas([]);
      setPreguntasFiltradas([]);
    }
  }, [necesidadSeleccionada]);

  useEffect(() => {
    aplicarFiltrosPreguntas();
  }, [preguntas, filtroPregunta, filtroCategoriaPregunta]);

  const fetchNecesidades = async () => {
    try {
      setCargandoNecesidades(true);
      const res = await fetch("/api/necesidades");
      if (!res.ok) throw new Error("Error al cargar necesidades");
      const data = await res.json();
      setNecesidades(data);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar las necesidades");
    } finally {
      setCargandoNecesidades(false);
    }
  };

  const fetchPreguntas = async (necesidad: string) => {
    try {
      setCargandoPreguntas(true);
      const res = await fetch(`/api/preguntas?necesidad=${encodeURIComponent(necesidad)}`);
      if (!res.ok) throw new Error("Error al cargar preguntas");
      const data = await res.json();
      setPreguntas(data);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar las preguntas");
    } finally {
      setCargandoPreguntas(false);
    }
  };

  const aplicarFiltrosNecesidades = () => {
    let resultado = [...necesidades];

    if (filtroNecesidad.trim()) {
      const texto = filtroNecesidad.toLowerCase();
      resultado = resultado.filter(
        (n) =>
          n.necesidad?.toLowerCase().includes(texto) ||
          n.categoria?.toLowerCase().includes(texto)
      );
    }

    if (filtroCategoriaNecc !== "todas") {
      resultado = resultado.filter((n) => n.categoria === filtroCategoriaNecc);
    }

    if (filtroHabilitado !== "todos") {
      const valor = filtroHabilitado === "habilitado";
      resultado = resultado.filter((n) => n.habilitado === valor);
    }

    setNecesidadesFiltradas(resultado);
  };

  const aplicarFiltrosPreguntas = () => {
    let resultado = [...preguntas];

    if (filtroPregunta.trim()) {
      const texto = filtroPregunta.toLowerCase();
      resultado = resultado.filter(
        (p) =>
          p.pregunta?.toLowerCase().includes(texto) ||
          p.respuesta?.toLowerCase().includes(texto)
      );
    }

    if (filtroCategoriaPregunta !== "todas") {
      resultado = resultado.filter((p) => p.categoria === filtroCategoriaPregunta);
    }

    setPreguntasFiltradas(resultado);
  };

  const mostrarMensaje = (msg: string) => {
    setMensaje(msg);
    setTimeout(() => setMensaje(null), 3000);
  };

  // CRUD Necesidades
  const abrirModalCrearNecesidad = () => {
    setFormNecesidad({ categoria: CATEGORIAS[0], habilitado: true });
    setNecesidadEditando(null);
    setModalNecesidad("crear");
  };

  const abrirModalEditarNecesidad = (n: Necesidad) => {
    setFormNecesidad({ ...n });
    setNecesidadEditando(n);
    setModalNecesidad("editar");
  };

  const guardarNecesidad = async () => {
    if (!formNecesidad.categoria || !formNecesidad.necesidad) {
      setError("Categoria y necesidad son requeridos");
      return;
    }

    setGuardando(true);
    setError(null);

    try {
      if (modalNecesidad === "crear") {
        const res = await fetch("/api/necesidades", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formNecesidad),
        });
        if (!res.ok) throw new Error("Error al crear necesidad");
        const nueva = await res.json();
        setNecesidades((prev) => [...prev, nueva]);
        mostrarMensaje("Necesidad creada correctamente");
      } else if (necesidadEditando) {
        const res = await fetch(`/api/necesidades/${necesidadEditando.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formNecesidad),
        });
        if (!res.ok) throw new Error("Error al actualizar necesidad");
        setNecesidades((prev) =>
          prev.map((n) =>
            n.id === necesidadEditando.id ? { ...n, ...formNecesidad } : n
          )
        );
        if (necesidadSeleccionada?.id === necesidadEditando.id) {
          setNecesidadSeleccionada({ ...necesidadSeleccionada, ...formNecesidad } as Necesidad);
        }
        mostrarMensaje("Necesidad actualizada correctamente");
      }
      setModalNecesidad(null);
    } catch (err) {
      console.error(err);
      setError("Error al guardar la necesidad");
    } finally {
      setGuardando(false);
    }
  };

  const eliminarNecesidad = async (id: number) => {
    setGuardando(true);
    try {
      const res = await fetch(`/api/necesidades/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar necesidad");
      setNecesidades((prev) => prev.filter((n) => n.id !== id));
      if (necesidadSeleccionada?.id === id) {
        setNecesidadSeleccionada(null);
      }
      mostrarMensaje("Necesidad eliminada correctamente");
    } catch (err) {
      console.error(err);
      mostrarMensaje("Error al eliminar la necesidad");
    } finally {
      setGuardando(false);
      setConfirmandoEliminar(null);
    }
  };

  // CRUD Preguntas
  const abrirModalCrearPregunta = (necesidad?: Necesidad) => {
    const nec = necesidad || necesidadSeleccionada;
    setFormPregunta({
      categoria: nec?.categoria || CATEGORIAS[0],
      necesidad: nec?.necesidad || "",
    });
    setVariantes([]);
    setNuevaVariante("");
    setImagenPreview(null);
    setPreguntaEditando(null);
    setModalPregunta("crear");
  };

  const abrirModalEditarPregunta = (p: Pregunta) => {
    setFormPregunta({ ...p });
    setVariantes(p.variante ? p.variante.split(";").filter(Boolean) : []);
    setNuevaVariante("");
    setImagenPreview(p.imagen || null);
    setPreguntaEditando(p);
    setModalPregunta("editar");
  };

  const manejarCambioImagen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (archivo) {
      // Validar tamaño (max 5MB)
      if (archivo.size > 5 * 1024 * 1024) {
        setError("La imagen no debe superar 5MB");
        return;
      }

      // Validar tipo
      if (!archivo.type.startsWith("image/")) {
        setError("Solo se permiten archivos de imagen");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImagenPreview(base64);
        setFormPregunta({ ...formPregunta, imagen: base64 });
      };
      reader.readAsDataURL(archivo);
    }
  };

  const quitarImagen = () => {
    setImagenPreview(null);
    setFormPregunta({ ...formPregunta, imagen: null });
  };

  const agregarVariante = () => {
    if (nuevaVariante.trim() && !variantes.includes(nuevaVariante.trim())) {
      setVariantes([...variantes, nuevaVariante.trim()]);
      setNuevaVariante("");
    }
  };

  const quitarVariante = (index: number) => {
    setVariantes(variantes.filter((_, i) => i !== index));
  };

  const guardarPregunta = async () => {
    if (!formPregunta.categoria || !formPregunta.necesidad || !formPregunta.pregunta) {
      setError("Categoria, necesidad y pregunta son requeridos");
      return;
    }

    setGuardando(true);
    setError(null);

    const datosGuardar = {
      ...formPregunta,
      variante: variantes.length > 0 ? variantes.join(";") : null,
      imagen: imagenPreview,
    };

    try {
      if (modalPregunta === "crear") {
        const res = await fetch("/api/preguntas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(datosGuardar),
        });
        if (!res.ok) throw new Error("Error al crear pregunta");
        const nueva = await res.json();
        setPreguntas((prev) => [...prev, nueva]);
        mostrarMensaje("Pregunta creada correctamente");
      } else if (preguntaEditando) {
        const res = await fetch(`/api/preguntas/${preguntaEditando.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(datosGuardar),
        });
        if (!res.ok) throw new Error("Error al actualizar pregunta");
        setPreguntas((prev) =>
          prev.map((p) =>
            p.id === preguntaEditando.id ? { ...p, ...datosGuardar } : p
          )
        );
        mostrarMensaje("Pregunta actualizada correctamente");
      }
      setModalPregunta(null);
    } catch (err) {
      console.error(err);
      setError("Error al guardar la pregunta");
    } finally {
      setGuardando(false);
    }
  };

  const eliminarPregunta = async (id: number) => {
    setGuardando(true);
    try {
      const res = await fetch(`/api/preguntas/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar pregunta");
      setPreguntas((prev) => prev.filter((p) => p.id !== id));
      mostrarMensaje("Pregunta eliminada correctamente");
    } catch (err) {
      console.error(err);
      mostrarMensaje("Error al eliminar la pregunta");
    } finally {
      setGuardando(false);
      setConfirmandoEliminar(null);
    }
  };

  const seleccionarNecesidad = (n: Necesidad) => {
    setNecesidadSeleccionada(n);
    setVistaMovil("preguntas");
  };

  if (cargandoNecesidades) {
    return (
      <div className="necesidades-page">
        <div className="necesidades-loading">
          <div className="loading-spinner"></div>
          <p>Cargando necesidades...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="necesidades-page">
      {/* Mensaje flotante */}
      {mensaje && <div className="mensaje-flotante">{mensaje}</div>}

      {/* Header */}
      <div className="necesidades-header">
        <div className="necesidades-header-left">
          <Link href="/" className="necesidades-back-btn">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
            </svg>
          </Link>
          <h1>Necesidades y Preguntas</h1>
        </div>
        <div className="necesidades-header-right">
          <span className="necesidades-count">
            {necesidades.length} necesidades
          </span>
          <button className="refresh-btn" onClick={fetchNecesidades} title="Actualizar">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tabs para movil */}
      <div className="necesidades-tabs-movil">
        <button
          className={`tab-btn ${vistaMovil === "necesidades" ? "active" : ""}`}
          onClick={() => setVistaMovil("necesidades")}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" />
          </svg>
          Necesidades
        </button>
        <button
          className={`tab-btn ${vistaMovil === "preguntas" ? "active" : ""}`}
          onClick={() => setVistaMovil("preguntas")}
          disabled={!necesidadSeleccionada}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
          </svg>
          Preguntas
          {necesidadSeleccionada && <span className="badge-count">{preguntas.length}</span>}
        </button>
      </div>

      {/* Contenido principal */}
      <div className="necesidades-contenido">
        {/* Panel izquierdo - Necesidades */}
        <div className={`panel-necesidades ${vistaMovil === "necesidades" ? "activo" : ""}`}>
          <div className="panel-header">
            <h2>Necesidades</h2>
            <button className="btn-crear-verde" onClick={abrirModalCrearNecesidad}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
              </svg>
              Nueva
            </button>
          </div>

          {/* Filtros necesidades */}
          <div className="panel-filtros">
            <div className="filtro-buscar">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
              </svg>
              <input
                type="text"
                placeholder="Buscar necesidad..."
                value={filtroNecesidad}
                onChange={(e) => setFiltroNecesidad(e.target.value)}
              />
            </div>
            <select
              value={filtroCategoriaNecc}
              onChange={(e) => setFiltroCategoriaNecc(e.target.value)}
            >
              <option value="todas">Todas las categorias</option>
              {CATEGORIAS.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <select
              value={filtroHabilitado}
              onChange={(e) => setFiltroHabilitado(e.target.value)}
            >
              <option value="todos">Todos</option>
              <option value="habilitado">Habilitados</option>
              <option value="deshabilitado">Deshabilitados</option>
            </select>
          </div>

          {/* Lista de necesidades */}
          <div className="lista-necesidades">
            {necesidadesFiltradas.length === 0 ? (
              <div className="lista-vacia">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11 15h2v2h-2zm0-8h2v6h-2zm.99-5C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" />
                </svg>
                <p>No se encontraron necesidades</p>
              </div>
            ) : (
              necesidadesFiltradas.map((n) => (
                <div
                  key={n.id}
                  className={`necesidad-item ${necesidadSeleccionada?.id === n.id ? "seleccionada" : ""} ${!n.habilitado ? "deshabilitada" : ""}`}
                  onClick={() => seleccionarNecesidad(n)}
                >
                  <div className="necesidad-info">
                    <div className="necesidad-nombre">{n.necesidad}</div>
                    <div className="necesidad-categoria">
                      <span className="badge-categoria">{n.categoria}</span>
                      {!n.habilitado && <span className="badge-deshabilitado">Deshabilitado</span>}
                    </div>
                  </div>
                  <div className="necesidad-acciones">
                    <button
                      className="btn-accion-mini agregar"
                      onClick={(e) => {
                        e.stopPropagation();
                        abrirModalCrearPregunta(n);
                      }}
                      title="Agregar pregunta"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                      </svg>
                    </button>
                    <button
                      className="btn-accion-mini editar"
                      onClick={(e) => {
                        e.stopPropagation();
                        abrirModalEditarNecesidad(n);
                      }}
                      title="Editar"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                      </svg>
                    </button>
                    <button
                      className="btn-accion-mini eliminar"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmandoEliminar({ tipo: "necesidad", id: n.id });
                      }}
                      title="Eliminar"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Panel derecho - Preguntas */}
        <div className={`panel-preguntas ${vistaMovil === "preguntas" ? "activo" : ""}`}>
          {necesidadSeleccionada ? (
            <>
              <div className="panel-header">
                <div className="header-con-volver">
                  <button className="btn-volver-movil" onClick={() => setVistaMovil("necesidades")}>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                    </svg>
                  </button>
                  <div>
                    <h2>Preguntas</h2>
                    <span className="necesidad-seleccionada-info">
                      {necesidadSeleccionada.necesidad}
                    </span>
                  </div>
                </div>
                <button className="btn-crear-verde" onClick={() => abrirModalCrearPregunta()}>
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                  </svg>
                  Nueva Pregunta
                </button>
              </div>

              {/* Filtros preguntas */}
              <div className="panel-filtros">
                <div className="filtro-buscar">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Buscar pregunta..."
                    value={filtroPregunta}
                    onChange={(e) => setFiltroPregunta(e.target.value)}
                  />
                </div>
                <select
                  value={filtroCategoriaPregunta}
                  onChange={(e) => setFiltroCategoriaPregunta(e.target.value)}
                >
                  <option value="todas">Todas las categorias</option>
                  {CATEGORIAS.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Lista de preguntas */}
              <div className="lista-preguntas">
                {cargandoPreguntas ? (
                  <div className="lista-cargando">
                    <div className="loading-spinner"></div>
                    <p>Cargando preguntas...</p>
                  </div>
                ) : preguntasFiltradas.length === 0 ? (
                  <div className="lista-vacia">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
                    </svg>
                    <p>No hay preguntas para esta necesidad</p>
                    <button className="btn-crear-verde" onClick={() => abrirModalCrearPregunta()}>
                      Crear primera pregunta
                    </button>
                  </div>
                ) : (
                  preguntasFiltradas.map((p) => (
                    <div key={p.id} className="pregunta-card">
                      <div className="pregunta-header">
                        <span className="badge-categoria">{p.categoria}</span>
                        <div className="pregunta-acciones">
                          <button
                            className="btn-accion-mini editar"
                            onClick={() => abrirModalEditarPregunta(p)}
                            title="Editar"
                          >
                            <svg viewBox="0 0 24 24" fill="currentColor">
                              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                            </svg>
                          </button>
                          <button
                            className="btn-accion-mini eliminar"
                            onClick={() => setConfirmandoEliminar({ tipo: "pregunta", id: p.id })}
                            title="Eliminar"
                          >
                            <svg viewBox="0 0 24 24" fill="currentColor">
                              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div className="pregunta-contenido">
                        <div className="pregunta-texto">
                          <strong>Pregunta:</strong> {p.pregunta}
                        </div>
                        {p.respuesta && (
                          <div className="respuesta-texto">
                            <strong>Respuesta:</strong>
                            <p>{p.respuesta}</p>
                          </div>
                        )}
                        {p.variante && (
                          <div className="variantes-lista">
                            <strong>Variantes:</strong>
                            <div className="variantes-tags">
                              {p.variante.split(";").filter(Boolean).map((v, i) => (
                                <span key={i} className="variante-tag">{v}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {p.imagen && (
                          <div className="pregunta-imagen">
                            <img src={p.imagen} alt="Imagen adjunta" />
                            {p.urlimagen && (
                              <div className="urlimagen-container">
                                <span className="urlimagen-label">URL para WhatsApp:</span>
                                <div className="urlimagen-copy">
                                  <input type="text" value={p.urlimagen} readOnly />
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(p.urlimagen || "");
                                      mostrarMensaje("URL copiada al portapapeles");
                                    }}
                                    title="Copiar URL"
                                  >
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                      <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        {p.video && (
                          <div className="pregunta-video">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                              <path d="M10 16.5l6-4.5-6-4.5v9zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                            </svg>
                            <a href={p.video} target="_blank" rel="noopener noreferrer">
                              {p.video}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="panel-vacio">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M15 4v7H5.17L4 12.17V4h11m1-2H3c-.55 0-1 .45-1 1v14l4-4h10c.55 0 1-.45 1-1V3c0-.55-.45-1-1-1zm5 4h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1z" />
              </svg>
              <h3>Selecciona una necesidad</h3>
              <p>Haz clic en una necesidad del panel izquierdo para ver sus preguntas</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Necesidad */}
      {modalNecesidad && (
        <div className="modal-overlay" onClick={() => setModalNecesidad(null)}>
          <div className="modal-content modal-verde" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modalNecesidad === "crear" ? "Nueva Necesidad" : "Editar Necesidad"}</h2>
              <button className="modal-close" onClick={() => setModalNecesidad(null)}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            </div>
            <div className="modal-form">
              {error && (
                <div className="modal-error">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                  </svg>
                  {error}
                </div>
              )}
              <div className="form-field">
                <label>Categoria</label>
                <select
                  value={formNecesidad.categoria || ""}
                  onChange={(e) => setFormNecesidad({ ...formNecesidad, categoria: e.target.value })}
                >
                  {CATEGORIAS.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label>Necesidad</label>
                <input
                  type="text"
                  placeholder="Nombre de la necesidad"
                  value={formNecesidad.necesidad || ""}
                  onChange={(e) => setFormNecesidad({ ...formNecesidad, necesidad: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label>Estado</label>
                <div className="toggle-container">
                  <button
                    className={`toggle-btn ${formNecesidad.habilitado ? "activo" : ""}`}
                    onClick={() => setFormNecesidad({ ...formNecesidad, habilitado: true })}
                  >
                    Habilitado
                  </button>
                  <button
                    className={`toggle-btn ${!formNecesidad.habilitado ? "activo" : ""}`}
                    onClick={() => setFormNecesidad({ ...formNecesidad, habilitado: false })}
                  >
                    Deshabilitado
                  </button>
                </div>
              </div>
              <div className="modal-actions">
                <button className="btn-cancelar" onClick={() => setModalNecesidad(null)}>
                  Cancelar
                </button>
                <button className="btn-guardar-verde" onClick={guardarNecesidad} disabled={guardando}>
                  {guardando ? <span className="btn-spinner"></span> : null}
                  {modalNecesidad === "crear" ? "Crear" : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pregunta */}
      {modalPregunta && (
        <div className="modal-overlay" onClick={() => setModalPregunta(null)}>
          <div className="modal-content modal-verde modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modalPregunta === "crear" ? "Nueva Pregunta" : "Editar Pregunta"}</h2>
              <button className="modal-close" onClick={() => setModalPregunta(null)}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            </div>
            <div className="modal-form">
              {error && (
                <div className="modal-error">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                  </svg>
                  {error}
                </div>
              )}
              <div className="form-row">
                <div className="form-field">
                  <label>Categoria</label>
                  <select
                    value={formPregunta.categoria || ""}
                    onChange={(e) => setFormPregunta({ ...formPregunta, categoria: e.target.value })}
                  >
                    {CATEGORIAS.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label>Necesidad</label>
                  <select
                    value={formPregunta.necesidad || ""}
                    onChange={(e) => setFormPregunta({ ...formPregunta, necesidad: e.target.value })}
                  >
                    <option value="">Seleccionar necesidad</option>
                    {necesidades.map((n) => (
                      <option key={n.id} value={n.necesidad || ""}>
                        {n.necesidad}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-field">
                <label>Pregunta</label>
                <input
                  type="text"
                  placeholder="Escriba la pregunta..."
                  value={formPregunta.pregunta || ""}
                  onChange={(e) => setFormPregunta({ ...formPregunta, pregunta: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label>Respuesta</label>
                <textarea
                  placeholder="Escriba la respuesta..."
                  rows={4}
                  value={formPregunta.respuesta || ""}
                  onChange={(e) => setFormPregunta({ ...formPregunta, respuesta: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label>Variantes (condiciones que modifican la respuesta)</label>
                <div className="variantes-editor">
                  <div className="variantes-input">
                    <input
                      type="text"
                      placeholder="Agregar variante..."
                      value={nuevaVariante}
                      onChange={(e) => setNuevaVariante(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          agregarVariante();
                        }
                      }}
                    />
                    <button className="btn-agregar-variante" onClick={agregarVariante}>
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                      </svg>
                    </button>
                  </div>
                  {variantes.length > 0 && (
                    <div className="variantes-tags-editor">
                      {variantes.map((v, i) => (
                        <span key={i} className="variante-tag-editor">
                          {v}
                          <button onClick={() => quitarVariante(i)}>
                            <svg viewBox="0 0 24 24" fill="currentColor">
                              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                            </svg>
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="form-field">
                <label>Imagen (opcional, max 5MB)</label>
                <div className="imagen-upload-container">
                  {imagenPreview ? (
                    <div className="imagen-preview-container">
                      <img src={imagenPreview} alt="Preview" className="imagen-preview" />
                      <button className="btn-quitar-imagen" onClick={quitarImagen} type="button">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                        </svg>
                        Quitar imagen
                      </button>
                    </div>
                  ) : (
                    <label className="imagen-upload-label">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={manejarCambioImagen}
                        className="imagen-input-hidden"
                      />
                      <div className="imagen-upload-placeholder">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                        </svg>
                        <span>Haz clic para seleccionar imagen</span>
                      </div>
                    </label>
                  )}
                </div>
              </div>
              <div className="form-field">
                <label>Enlace de Video (opcional)</label>
                <div className="video-input-container">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="video-input-icon">
                    <path d="M10 16.5l6-4.5-6-4.5v9zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                  </svg>
                  <input
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={formPregunta.video || ""}
                    onChange={(e) => setFormPregunta({ ...formPregunta, video: e.target.value || null })}
                    className="video-url-input"
                  />
                </div>
                <span className="video-help-text">Pega el enlace de YouTube, Vimeo u otra plataforma</span>
              </div>
              <div className="modal-actions">
                <button className="btn-cancelar" onClick={() => setModalPregunta(null)}>
                  Cancelar
                </button>
                <button className="btn-guardar-verde" onClick={guardarPregunta} disabled={guardando}>
                  {guardando ? <span className="btn-spinner"></span> : null}
                  {modalPregunta === "crear" ? "Crear" : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminar */}
      {confirmandoEliminar && (
        <div className="modal-overlay" onClick={() => setConfirmandoEliminar(null)}>
          <div className="modal-content modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header danger">
              <h2>Confirmar eliminacion</h2>
              <button className="modal-close" onClick={() => setConfirmandoEliminar(null)}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <p>
                Esta seguro de eliminar esta {confirmandoEliminar.tipo}?
              </p>
              <p className="warning-text">Esta accion no se puede deshacer.</p>
            </div>
            <div className="modal-actions">
              <button className="btn-cancelar" onClick={() => setConfirmandoEliminar(null)}>
                Cancelar
              </button>
              <button
                className="btn-eliminar-modal"
                onClick={() => {
                  if (confirmandoEliminar.tipo === "necesidad") {
                    eliminarNecesidad(confirmandoEliminar.id);
                  } else {
                    eliminarPregunta(confirmandoEliminar.id);
                  }
                }}
                disabled={guardando}
              >
                {guardando ? <span className="btn-spinner"></span> : null}
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
