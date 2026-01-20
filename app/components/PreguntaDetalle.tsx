"use client";

import { useEffect, useState } from "react";

interface Pregunta {
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
  enlace: string | null;
  cuenta_nombre?: string | null;
}

interface Props {
  id: number | null;
  onPreguntaActualizada?: () => void;
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

export default function PreguntaDetalle({ id, onPreguntaActualizada }: Props) {
  const [pregunta, setPregunta] = useState<Pregunta | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados del formulario
  const [respuesta, setRespuesta] = useState("");
  const [variantes, setVariantes] = useState<string[]>([]);
  const [nuevaVariante, setNuevaVariante] = useState("");
  const [imagenFile, setImagenFile] = useState<File | null>(null);
  const [imagenPreview, setImagenPreview] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);

  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [errorForm, setErrorForm] = useState("");
  const [progreso, setProgreso] = useState("");

  useEffect(() => {
    if (!id) {
      setPregunta(null);
      resetFormulario();
      return;
    }

    const cargarPregunta = async () => {
      setCargando(true);
      setError(null);
      setGuardado(false);
      try {
        const res = await fetch(`/api/preguntas/${id}`);
        if (!res.ok) {
          throw new Error("No se pudo cargar la pregunta");
        }
        const data = await res.json();
        setPregunta(data);

        // Cargar datos existentes en el formulario
        setRespuesta(data.respuesta || "");
        setVariantes(data.variante ? data.variante.split(";").filter(Boolean) : []);
        setImagenPreview(data.urlimagen || null);
        setVideoPreview(data.videourl || null);
      } catch (err) {
        console.error("Error cargando pregunta:", err);
        setError("No se pudo cargar la pregunta");
        setPregunta(null);
      } finally {
        setCargando(false);
      }
    };

    cargarPregunta();
  }, [id]);

  const resetFormulario = () => {
    setRespuesta("");
    setVariantes([]);
    setNuevaVariante("");
    setImagenFile(null);
    setImagenPreview(null);
    setVideoFile(null);
    setVideoPreview(null);
    setErrorForm("");
    setProgreso("");
    setGuardado(false);
  };

  // Manejo de variantes
  const agregarVariante = () => {
    if (nuevaVariante.trim() && !variantes.includes(nuevaVariante.trim())) {
      setVariantes([...variantes, nuevaVariante.trim()]);
      setNuevaVariante("");
    }
  };

  const eliminarVariante = (index: number) => {
    setVariantes(variantes.filter((_, i) => i !== index));
  };

  // Manejo de imagen
  const manejarCambioImagen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (archivo) {
      if (archivo.size > 5 * 1024 * 1024) {
        setErrorForm("La imagen no debe superar 5MB");
        return;
      }
      if (!archivo.type.startsWith("image/")) {
        setErrorForm("Solo se permiten archivos de imagen");
        return;
      }
      setImagenFile(archivo);
      setImagenPreview(URL.createObjectURL(archivo));
      setErrorForm("");
    }
  };

  const quitarImagen = () => {
    if (imagenPreview && imagenFile) {
      URL.revokeObjectURL(imagenPreview);
    }
    setImagenFile(null);
    setImagenPreview(null);
  };

  // Manejo de video
  const manejarCambioVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (archivo) {
      if (archivo.size > 50 * 1024 * 1024) {
        setErrorForm("El video no debe superar 50MB");
        return;
      }
      if (!archivo.type.startsWith("video/")) {
        setErrorForm("Solo se permiten archivos de video");
        return;
      }
      setVideoFile(archivo);
      setVideoPreview(URL.createObjectURL(archivo));
      setErrorForm("");
    }
  };

  const quitarVideo = () => {
    if (videoPreview && videoFile) {
      URL.revokeObjectURL(videoPreview);
    }
    setVideoFile(null);
    setVideoPreview(null);
  };

  // Subir archivo al servidor
  const subirArchivo = async (file: File, tipo: "imagen" | "video"): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("tipo", tipo);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      throw new Error(`Error al subir ${tipo}`);
    }

    const data = await res.json();
    return data.url;
  };

  // Guardar pregunta
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!pregunta) return;

    if (!respuesta.trim()) {
      setErrorForm("La respuesta es requerida");
      return;
    }

    setGuardando(true);
    setErrorForm("");

    try {
      let imagenUrl: string | null = imagenPreview;
      let videoUrl: string | null = videoPreview;

      // Subir imagen si hay un nuevo archivo
      if (imagenFile) {
        setProgreso("Subiendo imagen...");
        imagenUrl = await subirArchivo(imagenFile, "imagen");
      }

      // Subir video si hay un nuevo archivo
      if (videoFile) {
        setProgreso("Subiendo video...");
        videoUrl = await subirArchivo(videoFile, "video");
      }

      setProgreso("Guardando pregunta...");

      const payload = {
        respuesta: respuesta.trim(),
        variante: variantes.length > 0 ? variantes.join(";") : null,
        imagenUrl: imagenUrl,
        videoUrl: videoUrl,
        habilitado: true, // Habilitar la pregunta al guardar
      };

      const res = await fetch(`/api/preguntas/${pregunta.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al guardar");
      }

      // Enviar respuesta al enlace externo si existe
      if (pregunta.enlace) {
        setProgreso("Enviando respuesta al servicio externo...");
        try {
          await fetch(pregunta.enlace, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              id: pregunta.id,
              categoria: pregunta.categoria,
              necesidad: pregunta.necesidad,
              pregunta: pregunta.pregunta,
              respuesta: respuesta.trim(),
              variantes: variantes,
              imagenUrl: imagenUrl,
              videoUrl: videoUrl,
            }),
          });
        } catch (enlaceError) {
          console.error("Error al enviar al enlace externo:", enlaceError);
          // No fallar el guardado por error en enlace externo
        }
      }

      setGuardado(true);
      if (onPreguntaActualizada) {
        onPreguntaActualizada();
      }
    } catch (err) {
      console.error(err);
      setErrorForm("No se pudo guardar. Intenta nuevamente.");
    } finally {
      setGuardando(false);
      setProgreso("");
    }
  };

  // Pantalla de bienvenida cuando no hay id seleccionado
  if (!id) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="wa-header">
          <div className="wa-header-avatar">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
            </svg>
          </div>
          <div className="wa-header-info">
            <span className="wa-header-name">Gestión de Preguntas</span>
            <span className="wa-header-status">Selecciona una pregunta</span>
          </div>
        </div>

        <div className="wa-chat-area">
          <div className="bienvenida-container">
            <div className="bienvenida-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
              </svg>
            </div>
            <h2>Bienvenido a Gestión de Preguntas</h2>
            <p>Selecciona una pregunta de la lista para agregar la respuesta, variantes e imágenes.</p>
          </div>
        </div>
      </div>
    );
  }

  // Pantalla de carga
  if (cargando) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="wa-header">
          <div className="wa-header-avatar">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
            </svg>
          </div>
          <div className="wa-header-info">
            <span className="wa-header-name">Cargando...</span>
          </div>
        </div>
        <div className="wa-chat-area">
          <div className="bienvenida-container">
            <div className="loading-spinner" style={{ width: 40, height: 40 }}></div>
            <p>Cargando pregunta...</p>
          </div>
        </div>
      </div>
    );
  }

  // Pantalla de error
  if (error || !pregunta) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="wa-header">
          <div className="wa-header-avatar">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
          </div>
          <div className="wa-header-info">
            <span className="wa-header-name">Error</span>
          </div>
        </div>
        <div className="wa-chat-area">
          <div className="chat-container">
            <div className="bubble-bot">
              <p className="text-center" style={{ color: "#e53935" }}>Pregunta no encontrada</p>
              <p className="bubble-context text-center" style={{ marginTop: 8 }}>
                No se encontró información para esta pregunta.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Pantalla de guardado exitoso
  if (guardado) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="wa-header">
          <div className="wa-header-avatar" style={{ backgroundColor: getCategoriaColor(pregunta.categoria) }}>
            <span style={{ color: "white", fontWeight: 600 }}>{pregunta.categoria?.charAt(0).toUpperCase() || "?"}</span>
          </div>
          <div className="wa-header-info">
            <span className="wa-header-name">{pregunta.necesidad}</span>
            <span className="wa-header-status">{pregunta.categoria} - Completado</span>
          </div>
        </div>
        <div className="wa-chat-area">
          <div className="chat-container">
            <div className="bubble-user">
              <div className="enviado-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <p className="text-center" style={{ color: "#075e54", fontWeight: 500 }}>
                Pregunta guardada y habilitada correctamente
              </p>
              <p className="bubble-context text-center mt-2" style={{ fontSize: "13px" }}>
                La pregunta ahora está disponible para el chatbot.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Formulario para completar la pregunta
  return (
    <div className="min-h-screen flex flex-col">
      <div className="wa-header">
        <div className="wa-header-avatar" style={{ backgroundColor: getCategoriaColor(pregunta.categoria) }}>
          <span style={{ color: "white", fontWeight: 600 }}>{pregunta.categoria?.charAt(0).toUpperCase() || "?"}</span>
        </div>
        <div className="wa-header-info">
          <span className="wa-header-name">{pregunta.necesidad}</span>
          <span className="wa-header-status">{pregunta.categoria} - Pendiente</span>
        </div>
      </div>

      <div className="wa-chat-area">
        <div className="chat-container">
          {/* Información de la pregunta */}
          <div className="bubble-bot">
            <div className="bubble-label">Categoría</div>
            <p className="bubble-context" style={{ color: getCategoriaColor(pregunta.categoria), fontWeight: 500 }}>
              {pregunta.categoria}
            </p>
          </div>

          <div className="bubble-bot">
            <div className="bubble-label">Necesidad</div>
            <p className="bubble-title">{pregunta.necesidad}</p>
          </div>

          {pregunta.contexto && (
            <div className="bubble-bot">
              <div className="bubble-label">Contexto</div>
              <p className="bubble-context">{pregunta.contexto}</p>
            </div>
          )}

          <div className="bubble-bot">
            <div className="bubble-label">Pregunta</div>
            <p className="bubble-title">{pregunta.pregunta}</p>
          </div>

          {/* Indicador de enlace externo */}
          {pregunta.enlace && (
            <div className="bubble-bot enlace-indicator">
              <div className="enlace-badge">
                <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 16, height: 16 }}>
                  <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
                </svg>
                <span>La respuesta se enviará automáticamente al servicio externo</span>
              </div>
            </div>
          )}

          {/* Formulario de respuesta */}
          <form onSubmit={handleSubmit}>
            {/* Campo de respuesta */}
            <div className="bubble-user">
              <div className="bubble-label" style={{ color: "#075e54" }}>Respuesta *</div>
              <textarea
                value={respuesta}
                onChange={(e) => {
                  setRespuesta(e.target.value);
                  setErrorForm("");
                }}
                disabled={guardando}
                className="chat-textarea"
                placeholder="Escribe la respuesta para esta pregunta..."
                rows={4}
              />
            </div>

            {/* Campo de variantes */}
            <div className="bubble-user">
              <div className="bubble-label" style={{ color: "#075e54" }}>Variantes (opcional)</div>
              <div className="variantes-container">
                {variantes.map((v, index) => (
                  <div key={index} className="variante-chip">
                    <span>{v}</span>
                    <button
                      type="button"
                      onClick={() => eliminarVariante(index)}
                      disabled={guardando}
                      className="variante-remove"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
              <div className="variante-input-container">
                <input
                  type="text"
                  value={nuevaVariante}
                  onChange={(e) => setNuevaVariante(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      agregarVariante();
                    }
                  }}
                  disabled={guardando}
                  placeholder="Agregar variante y presionar Enter"
                  className="variante-input"
                />
                <button
                  type="button"
                  onClick={agregarVariante}
                  disabled={guardando || !nuevaVariante.trim()}
                  className="variante-add-btn"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Campo de imagen */}
            <div className="bubble-user">
              <div className="adjunto-label">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                </svg>
                <span>Imagen (opcional, max 5MB)</span>
              </div>
              {imagenPreview ? (
                <div className="adjunto-preview">
                  <img src={imagenPreview} alt="Preview" />
                  <button type="button" className="btn-quitar-adjunto" onClick={quitarImagen}>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                    </svg>
                    Quitar
                  </button>
                </div>
              ) : (
                <label className="adjunto-upload">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={manejarCambioImagen}
                    disabled={guardando}
                  />
                  <span>Haz clic para seleccionar imagen</span>
                </label>
              )}
            </div>

            {/* Campo de video */}
            <div className="bubble-user">
              <div className="adjunto-label">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M10 16.5l6-4.5-6-4.5v9zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                </svg>
                <span>Video (opcional, max 50MB)</span>
              </div>
              {videoPreview ? (
                <div className="adjunto-preview adjunto-preview-video">
                  <video src={videoPreview} controls />
                  <button type="button" className="btn-quitar-adjunto" onClick={quitarVideo}>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                    </svg>
                    Quitar
                  </button>
                </div>
              ) : (
                <label className="adjunto-upload">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={manejarCambioVideo}
                    disabled={guardando}
                  />
                  <span>Haz clic para seleccionar video</span>
                </label>
              )}
            </div>

            {/* Mensaje de progreso */}
            {progreso && (
              <p className="progreso-mensaje" style={{ textAlign: "center", color: "#075e54", fontSize: "13px", margin: "8px 0" }}>
                {progreso}
              </p>
            )}

            {/* Mensaje de error */}
            {errorForm && (
              <p className="error-mensaje">
                {errorForm}
              </p>
            )}

            {/* Botón de guardar */}
            <div className="chat-actions">
              <button
                type="submit"
                className="chat-send"
                title="Guardar y habilitar"
                disabled={guardando || !respuesta.trim()}
                style={{
                  opacity: guardando || !respuesta.trim() ? 0.5 : 1
                }}
              >
                {guardando ? (
                  <svg className="animate-spin" viewBox="0 0 24 24" fill="none" style={{ width: 22, height: 22 }}>
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="60" strokeDashoffset="20" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 22, height: 22 }}>
                    <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/>
                  </svg>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
