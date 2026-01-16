"use client";

import { useState } from "react";

interface Props {
  guid: string;
  enlace: string;
  onEnviado?: () => void;
}

type Opcion = "bloquear" | "ignorar" | "responder" | null;

export default function FormularioRespuesta({ guid, enlace, onEnviado }: Props) {
  const [opcionSeleccionada, setOpcionSeleccionada] = useState<Opcion>(null);
  const [respuesta, setRespuesta] = useState("");

  // Estados para archivos
  const [imagenFile, setImagenFile] = useState<File | null>(null);
  const [imagenPreview, setImagenPreview] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);

  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState("");
  const [progreso, setProgreso] = useState("");

  const manejarCambioImagen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (archivo) {
      if (archivo.size > 5 * 1024 * 1024) {
        setError("La imagen no debe superar 5MB");
        return;
      }
      if (!archivo.type.startsWith("image/")) {
        setError("Solo se permiten archivos de imagen");
        return;
      }
      setImagenFile(archivo);
      setImagenPreview(URL.createObjectURL(archivo));
      setError("");
    }
  };

  const quitarImagen = () => {
    if (imagenPreview) {
      URL.revokeObjectURL(imagenPreview);
    }
    setImagenFile(null);
    setImagenPreview(null);
  };

  const manejarCambioVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (archivo) {
      if (archivo.size > 50 * 1024 * 1024) {
        setError("El video no debe superar 50MB");
        return;
      }
      if (!archivo.type.startsWith("video/")) {
        setError("Solo se permiten archivos de video");
        return;
      }
      setVideoFile(archivo);
      setVideoPreview(URL.createObjectURL(archivo));
      setError("");
    }
  };

  const quitarVideo = () => {
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }
    setVideoFile(null);
    setVideoPreview(null);
  };

  // Funcion para subir archivo al servidor
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones
    if (!opcionSeleccionada) {
      setError("Por favor selecciona una opcion");
      return;
    }

    if (opcionSeleccionada === "responder" && !respuesta.trim()) {
      setError("Por favor escribe una respuesta");
      return;
    }

    setEnviando(true);
    setError("");

    try {
      let imagenUrl: string | null = null;
      let videoUrl: string | null = null;

      // Subir imagen si existe
      if (opcionSeleccionada === "responder" && imagenFile) {
        setProgreso("Subiendo imagen...");
        imagenUrl = await subirArchivo(imagenFile, "imagen");
      }

      // Subir video si existe
      if (opcionSeleccionada === "responder" && videoFile) {
        setProgreso("Subiendo video...");
        videoUrl = await subirArchivo(videoFile, "video");
      }

      setProgreso("Enviando respuesta...");

      const payload = {
        guid,
        enlace,
        accion: opcionSeleccionada,
        respuesta: opcionSeleccionada === "responder" ? respuesta.trim() : null,
        imagenUrl: opcionSeleccionada === "responder" ? imagenUrl : null,
        videoUrl: opcionSeleccionada === "responder" ? videoUrl : null,
      };

      const res = await fetch("/api/enviar-respuesta", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Error al enviar");
      }

      setEnviado(true);
      if (onEnviado) {
        onEnviado();
      }
    } catch (err) {
      console.error(err);
      setError("No se pudo enviar. Intenta nuevamente.");
    } finally {
      setEnviando(false);
      setProgreso("");
    }
  };

  const getMensajeConfirmacion = () => {
    switch (opcionSeleccionada) {
      case "bloquear":
        return "Se ha registrado tu decision de bloquear";
      case "ignorar":
        return "Se ha registrado tu decision de ignorar";
      case "responder":
        return "Tu respuesta ha sido enviada correctamente";
      default:
        return "Enviado correctamente";
    }
  };

  if (enviado) {
    return (
      <div className="bubble-user">
        <div className="enviado-icon">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>
        <p className="text-center" style={{ color: "#075e54", fontWeight: 500 }}>
          {getMensajeConfirmacion()}
        </p>
        <p className="bubble-context text-center mt-2" style={{ fontSize: "13px" }}>
          Gracias. Puedes cerrar esta ventana.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Opciones de accion */}
      <div className="bubble-bot">
        <div className="bubble-label">Selecciona una accion</div>
        <div className="opciones-container">
          <button
            type="button"
            className={`opcion-btn opcion-bloquear ${opcionSeleccionada === "bloquear" ? "selected" : ""}`}
            onClick={() => {
              setOpcionSeleccionada("bloquear");
              setError("");
            }}
            disabled={enviando}
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM4 12c0-4.42 3.58-8 8-8 1.85 0 3.55.63 4.9 1.69L5.69 16.9C4.63 15.55 4 13.85 4 12zm8 8c-1.85 0-3.55-.63-4.9-1.69L18.31 7.1C19.37 8.45 20 10.15 20 12c0 4.42-3.58 8-8 8z"/>
            </svg>
            <span>Bloquear</span>
          </button>

          <button
            type="button"
            className={`opcion-btn opcion-ignorar ${opcionSeleccionada === "ignorar" ? "selected" : ""}`}
            onClick={() => {
              setOpcionSeleccionada("ignorar");
              setError("");
            }}
            disabled={enviando}
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            <span>Ignorar</span>
          </button>

          <button
            type="button"
            className={`opcion-btn opcion-responder ${opcionSeleccionada === "responder" ? "selected" : ""}`}
            onClick={() => {
              setOpcionSeleccionada("responder");
              setError("");
            }}
            disabled={enviando}
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/>
            </svg>
            <span>Responder</span>
          </button>
        </div>
      </div>

      {/* Campo de respuesta (solo si selecciono responder) */}
      {opcionSeleccionada === "responder" && (
        <>
          <div className="bubble-user">
            <textarea
              value={respuesta}
              onChange={(e) => {
                setRespuesta(e.target.value);
                setError("");
              }}
              disabled={enviando}
              className="chat-textarea"
              placeholder="Escribe tu respuesta..."
              rows={3}
            />
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
                  disabled={enviando}
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
                  disabled={enviando}
                />
                <span>Haz clic para seleccionar video</span>
              </label>
            )}
          </div>
        </>
      )}

      {/* Mensaje de progreso */}
      {progreso && (
        <p className="progreso-mensaje" style={{ textAlign: "center", color: "#075e54", fontSize: "13px", margin: "8px 0" }}>
          {progreso}
        </p>
      )}

      {/* Mensaje de error */}
      {error && (
        <p className="error-mensaje">
          {error}
        </p>
      )}

      {/* Boton de enviar */}
      <div className="chat-actions">
        <button
          type="submit"
          className="chat-send"
          title="Enviar"
          disabled={enviando || !opcionSeleccionada || (opcionSeleccionada === "responder" && !respuesta.trim())}
          style={{
            opacity: enviando || !opcionSeleccionada || (opcionSeleccionada === "responder" && !respuesta.trim()) ? 0.5 : 1
          }}
        >
          {enviando ? (
            <svg className="animate-spin" viewBox="0 0 24 24" fill="none" style={{ width: 22, height: 22 }}>
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="60" strokeDashoffset="20" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 22, height: 22, marginLeft: 2 }}>
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          )}
        </button>
      </div>
    </form>
  );
}
