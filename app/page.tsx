export const dynamic = "force-dynamic";

import pool from "@/lib/db";
import FormularioRespuesta from "./components/FormularioRespuesta";

interface ConsultaData {
  pregunta: string;
  contexto: string;
  enlace: string;
}

async function getConsultaData(guid: string): Promise<ConsultaData | null> {
  console.log("Buscando GUID:", guid);

  try {
    const result = await pool.query(
      `
      SELECT pregunta, contexto, enlace
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

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ guid?: string }>;
}) {
  const params = await searchParams;
  const guid = params?.guid;

  if (!guid) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="chat-container">
          <div className="bubble-bot">
            <p className="text-center text-red-500">Enlace invalido o incompleto</p>
            <p className="bubble-context text-center mt-2">
              Por favor, verifica el enlace e intenta nuevamente.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const data = await getConsultaData(guid);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="chat-container">
          <div className="bubble-bot">
            <p className="text-center text-red-500">Consulta no encontrada</p>
            <p className="bubble-context text-center mt-2">
              No se encontro informacion para este enlace.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header estilo WhatsApp */}
      <div className="wa-header">
        <div className="wa-header-avatar">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
          </svg>
        </div>
        <div className="wa-header-info">
          <span className="wa-header-name">Asistente</span>
          <span className="wa-header-status">en linea</span>
        </div>
      </div>

      {/* Chat area */}
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
  );
}
