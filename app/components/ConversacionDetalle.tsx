"use client";

import { useEffect, useState } from "react";
import FormularioRespuesta from "./FormularioRespuesta";

interface Conversacion {
  guid: string;
  telefonocliente: string;
  contexto: string;
  pregunta: string;
  estado: string;
  paso: string;
  enlace: string;
  accionadmin: string | null;
  respuesta: string | null;
  nombreusuario: string | null;
}

interface Props {
  guid: string | null;
  onConversacionActualizada?: () => void;
}

function getAccionLabel(accion: string | null): string {
  switch (accion) {
    case "bloquear":
      return "Bloquear";
    case "ignorar":
      return "Ignorar";
    case "responder":
      return "Responder";
    default:
      return accion || "";
  }
}

function getAccionColor(accion: string | null): string {
  switch (accion) {
    case "bloquear":
      return "#e53935";
    case "ignorar":
      return "#fb8c00";
    case "responder":
      return "#075e54";
    default:
      return "#666";
  }
}

export default function ConversacionDetalle({ guid, onConversacionActualizada }: Props) {
  const [conversacion, setConversacion] = useState<Conversacion | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!guid) {
      setConversacion(null);
      return;
    }

    const cargarConversacion = async () => {
      setCargando(true);
      setError(null);
      try {
        const res = await fetch(`/api/conversacion/${guid}`);
        if (!res.ok) {
          throw new Error("No se pudo cargar la conversacion");
        }
        const data = await res.json();
        setConversacion(data);
      } catch (err) {
        console.error("Error cargando conversacion:", err);
        setError("No se pudo cargar la conversacion");
        setConversacion(null);
      } finally {
        setCargando(false);
      }
    };

    cargarConversacion();
  }, [guid]);

  // Pantalla de bienvenida cuando no hay guid seleccionado
  if (!guid) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="wa-header">
          <div className="wa-header-avatar">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/>
            </svg>
          </div>
          <div className="wa-header-info">
            <span className="wa-header-name">Gestión de ChatBot</span>
            <span className="wa-header-status">Selecciona una conversacion</span>
          </div>
        </div>

        <div className="wa-chat-area">
          <div className="bienvenida-container">
            <div className="bienvenida-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/>
              </svg>
            </div>
            <h2>Bienvenido a Gestión de ChatBot</h2>
            <p>Selecciona una conversacion de la lista para ver los detalles y responder.</p>
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
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
            </svg>
          </div>
          <div className="wa-header-info">
            <span className="wa-header-name">Cargando...</span>
          </div>
        </div>
        <div className="wa-chat-area">
          <div className="bienvenida-container">
            <div className="loading-spinner" style={{ width: 40, height: 40 }}></div>
            <p>Cargando conversacion...</p>
          </div>
        </div>
      </div>
    );
  }

  // Pantalla de error
  if (error || !conversacion) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="wa-header">
          <div className="wa-header-avatar">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
            </svg>
          </div>
          <div className="wa-header-info">
            <span className="wa-header-name">Error</span>
          </div>
        </div>
        <div className="wa-chat-area">
          <div className="chat-container">
            <div className="bubble-bot">
              <p className="text-center" style={{ color: "#e53935" }}>Consulta no encontrada</p>
              <p className="bubble-context text-center" style={{ marginTop: 8 }}>
                No se encontro informacion para esta conversacion.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar detalle de conversacion completada (solo lectura)
  if (conversacion.estado !== "pendiente") {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="wa-header">
          <div className="wa-header-avatar">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
            </svg>
          </div>
          <div className="wa-header-info">
            <span className="wa-header-name">
              {conversacion.nombreusuario || conversacion.telefonocliente || "Cliente"}
            </span>
            <span className="wa-header-status">
              {conversacion.paso || "Conversacion"} - Completado
            </span>
          </div>
        </div>

        <div className="wa-chat-area">
          <div className="chat-container">
            {/* Badge de completado */}
            <div className="estado-completado-banner">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              <span>Esta conversacion ha sido completada</span>
            </div>

            {/* Contexto */}
            <div className="bubble-bot">
              <div className="bubble-label">Contexto</div>
              <p className="bubble-context">{conversacion.contexto}</p>
            </div>

            {/* Pregunta */}
            <div className="bubble-bot">
              <div className="bubble-label">Pregunta</div>
              <p className="bubble-title">{conversacion.pregunta}</p>
            </div>

            {/* Accion elegida */}
            {conversacion.accionadmin && (
              <div className="bubble-user">
                <div className="bubble-label" style={{ color: getAccionColor(conversacion.accionadmin) }}>
                  Accion elegida
                </div>
                <p className="bubble-title" style={{ color: getAccionColor(conversacion.accionadmin) }}>
                  {getAccionLabel(conversacion.accionadmin)}
                </p>
              </div>
            )}

            {/* Respuesta (si existe y la accion fue responder) */}
            {conversacion.accionadmin === "responder" && conversacion.respuesta && (
              <div className="bubble-user">
                <div className="bubble-label" style={{ color: "#075e54" }}>
                  Respuesta enviada
                </div>
                <p className="bubble-context">{conversacion.respuesta}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Formulario para conversacion pendiente
  return (
    <div className="min-h-screen flex flex-col">
      <div className="wa-header">
        <div className="wa-header-avatar">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
          </svg>
        </div>
        <div className="wa-header-info">
          <span className="wa-header-name">
            {conversacion.nombreusuario || conversacion.telefonocliente || "Cliente"}
          </span>
          <span className="wa-header-status">
            {conversacion.paso || "Conversacion"} - Pendiente
          </span>
        </div>
      </div>

      <div className="wa-chat-area">
        <div className="chat-container">
          {/* Burbuja de contexto */}
          <div className="bubble-bot">
            <div className="bubble-label">Contexto</div>
            <p className="bubble-context">{conversacion.contexto}</p>
            <span className="bubble-time">
              {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* Burbuja de pregunta */}
          <div className="bubble-bot">
            <div className="bubble-label">Pregunta</div>
            <p className="bubble-title">{conversacion.pregunta}</p>
            <span className="bubble-time">
              {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* Formulario de respuesta */}
          <FormularioRespuesta
            guid={conversacion.guid}
            enlace={conversacion.enlace}
            onEnviado={onConversacionActualizada}
          />
        </div>
      </div>
    </div>
  );
}
