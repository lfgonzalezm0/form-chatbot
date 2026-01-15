export const dynamic = "force-dynamic";

import pool from "@/lib/db";
import FormularioRespuesta from "./components/FormularioRespuesta";
import AppLayout from "./components/AppLayout";

interface ConsultaData {
  pregunta: string;
  contexto: string;
  enlace: string;
  estado: string;
  paso: string | null;
  accionadmin: string | null;
  respuesta: string | null;
  telefonocliente: string | null;
}

async function getConsultaData(guid: string): Promise<ConsultaData | null> {
  console.log("Buscando GUID:", guid);

  try {
    const result = await pool.query(
      `
      SELECT pregunta, contexto, enlace, estado, paso, accionadmin, respuesta, telefonocliente
      FROM consultanecesidad
      WHERE guid = $1
      LIMIT 1
      `,
      [guid]
    );

    console.log("Resultado de la consulta:", result.rows.length, "registros encontrados");

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  } catch (error) {
    console.error("Error al consultar la base de datos:", error);
    return null;
  }
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

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ guid?: string }>;
}) {
  const params = await searchParams;
  const guid = params?.guid;

  // Pantalla de bienvenida cuando no hay guid
  if (!guid) {
    return (
      <AppLayout>
        <div className="min-h-screen flex flex-col">
          <div className="wa-header">
            <div className="wa-header-avatar">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/>
              </svg>
            </div>
            <div className="wa-header-info">
              <span className="wa-header-name">Panel de Conversaciones</span>
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
              <h2>Bienvenido al Panel de Conversaciones</h2>
              <p>Selecciona una conversacion de la lista para ver los detalles y responder.</p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  const data = await getConsultaData(guid);

  if (!data) {
    return (
      <AppLayout>
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
                <p className="text-center text-red-500">Consulta no encontrada</p>
                <p className="bubble-context text-center mt-2">
                  No se encontro informacion para este enlace.
                </p>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Mostrar detalle de conversacion completada (solo lectura)
  if (data.estado !== "pendiente") {
    return (
      <AppLayout>
        <div className="min-h-screen flex flex-col">
          <div className="wa-header">
            <div className="wa-header-avatar">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
            </svg>
            </div>
            <div className="wa-header-info">
              <span className="wa-header-name">{data.telefonocliente || "Cliente"}</span>
              <span className="wa-header-status">
                {data.paso || "Conversacion"} - Completado
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
                <p className="bubble-context">{data.contexto}</p>
              </div>

              {/* Pregunta */}
              <div className="bubble-bot">
                <div className="bubble-label">Pregunta</div>
                <p className="bubble-title">{data.pregunta}</p>
              </div>

              {/* Accion elegida */}
              {data.accionadmin && (
                <div className="bubble-user">
                  <div className="bubble-label" style={{ color: getAccionColor(data.accionadmin) }}>
                    Accion elegida
                  </div>
                  <p className="bubble-title" style={{ color: getAccionColor(data.accionadmin) }}>
                    {getAccionLabel(data.accionadmin)}
                  </p>
                </div>
              )}

              {/* Respuesta (si existe y la accion fue responder) */}
              {data.accionadmin === "responder" && data.respuesta && (
                <div className="bubble-user">
                  <div className="bubble-label" style={{ color: "#075e54" }}>
                    Respuesta enviada
                  </div>
                  <p className="bubble-context">{data.respuesta}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Formulario para conversacion pendiente
  return (
    <AppLayout>
      <div className="min-h-screen flex flex-col">
        <div className="wa-header">
          <div className="wa-header-avatar">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
            </svg>
          </div>
          <div className="wa-header-info">
            <span className="wa-header-name">{data.telefonocliente || "Cliente"}</span>
            <span className="wa-header-status">
              {data.paso || "Conversacion"} - Pendiente
            </span>
          </div>
        </div>

        <div className="wa-chat-area">
          <div className="chat-container">
            {/* Burbuja de contexto */}
            <div className="bubble-bot">
              <div className="bubble-label">Contexto</div>
              <p className="bubble-context">{data.contexto}</p>
              <span className="bubble-time">
                {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {/* Burbuja de pregunta */}
            <div className="bubble-bot">
              <div className="bubble-label">Pregunta</div>
              <p className="bubble-title">{data.pregunta}</p>
              <span className="bubble-time">
                {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {/* Formulario de respuesta */}
            <FormularioRespuesta guid={guid} enlace={data.enlace} />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
