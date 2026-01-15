export const dynamic = "force-dynamic";

import pool from "@/lib/db";

interface ConsultaData {
  pregunta: string;
  contexto: string;
  enlace: string;
}

async function getConsultaData(guid: string): Promise<ConsultaData | null> {
  try {
    const result = await pool.query(
      `
      SELECT pregunta, contexto, enlace
      FROM public."consultaNecesidad"
      WHERE guid = $1
      LIMIT 1
      `,
      [guid]
    );

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
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <div className="text-red-500 text-4xl mb-4">&#10060;</div>
          <h1 className="text-xl font-semibold text-gray-800">
            Enlace invalido o incompleto
          </h1>
          <p className="text-gray-600 mt-2">
            Por favor, verifica el enlace e intenta nuevamente.
          </p>
        </div>
      </div>
    );
  }

  const data = await getConsultaData(guid);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <div className="text-red-500 text-4xl mb-4">&#10060;</div>
          <h1 className="text-xl font-semibold text-gray-800">
            Consulta no encontrada
          </h1>
          <p className="text-gray-600 mt-2">
            No se encontro informacion para este enlace.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white w-full max-w-lg rounded-lg shadow-md overflow-hidden">
        <div className="bg-blue-600 text-white p-4">
          <h1 className="text-xl font-semibold">Formulario de Consulta</h1>
        </div>

        <div className="p-6 space-y-6">
          {/* Contexto */}
          <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500">
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Contexto
            </label>
            <p className="text-gray-800">{data.contexto}</p>
          </div>

          {/* Pregunta */}
          <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-600">
            <label className="block text-sm font-medium text-blue-600 mb-1">
              Pregunta
            </label>
            <p className="text-gray-800 font-medium">{data.pregunta}</p>
          </div>

          {/* Formulario de respuesta */}
          <form action={data.enlace} method="GET" className="space-y-4">
            <input type="hidden" name="guid" value={guid} />

            <div>
              <label
                htmlFor="respuesta"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Tu respuesta
              </label>
              <textarea
                id="respuesta"
                name="respuesta"
                rows={4}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-colors"
                placeholder="Escribe tu respuesta aqui..."
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Enviar Respuesta
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
