import { headers } from "next/headers";

async function getConsulta() {
  const headersList = await headers(); // 👈 await necesario
  const host = headersList.get("host");
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";

  const res = await fetch(
    `${protocol}://${host}/api/consulta-necesidad`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    throw new Error("Error cargando consulta");
  }

  return res.json();
}

export default async function FormularioWhatsapp() {
  const data = await getConsulta();

  return (
    <div className="chat-container">
      <div className="bubble-bot">
        <div className="bubble-title">
          {data?.pregunta ?? "Pregunta no disponible"}
        </div>

        <div className="bubble-context">
          {data?.contexto ?? "Sin contexto registrado"}
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