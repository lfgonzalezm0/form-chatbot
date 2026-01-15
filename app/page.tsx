type Consulta = {
  pregunta: string;
  contexto: string;
};

async function getConsulta(guid: string): Promise<Consulta | null> {
  const res = await fetch(
    `/api/consulta-necesidad?guid=${guid}`,
    { cache: "no-store" }
  );

  // Si no existe la consulta
  if (res.status === 404) {
    return null;
  }

  // Cualquier otro error
  if (!res.ok) {
    console.error("Error API:", res.status);
    return null;
  }

  return res.json();
}

export default async function Page({
  searchParams,
}: {
  searchParams: { guid?: string };
}) {
  const guid = searchParams?.guid;

  // GUID no enviado
  if (!guid) {
    return (
      <div className="chat-container">
        <div className="bubble-bot">
          Enlace inválido o incompleto.
        </div>
      </div>
    );
  }

  const data = await getConsulta(guid);

  // GUID no encontrado en BD
  if (!data) {
    return (
      <div className="chat-container">
        <div className="bubble-bot">
          Consulta no encontrada o expirada.
        </div>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <div className="bubble-bot">
        <div className="bubble-title">
          {data.pregunta}
        </div>

        <div className="bubble-context">
          {data.contexto}
        </div>
      </div>

      <div className="bubble-user">
        <textarea
          className="chat-textarea"
          placeholder="Escribe tu respuesta…"
        />
      </div>

      <div className="chat-actions">
        <button className="chat-send">➤</button>
      </div>
    </div>
  );
}