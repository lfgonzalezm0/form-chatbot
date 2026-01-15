"use client";

import { useState } from "react";

interface Props {
  guid: string;
  enlace: string;
}

export default function FormularioRespuesta({ guid, enlace }: Props) {
  const [respuesta, setRespuesta] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!respuesta.trim()) return;

    setEnviando(true);
    setError("");

    try {
      const res = await fetch("/api/enviar-respuesta", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          guid,
          enlace,
          respuesta: respuesta.trim(),
        }),
      });

      if (!res.ok) {
        throw new Error("Error al enviar");
      }

      setEnviado(true);
    } catch (err) {
      console.error(err);
      setError("No se pudo enviar la respuesta. Intenta nuevamente.");
    } finally {
      setEnviando(false);
    }
  };

  if (enviado) {
    return (
      <div className="bubble-user">
        <p className="text-center" style={{ color: "#075e54", fontWeight: 500 }}>
          Respuesta enviada correctamente
        </p>
        <p className="bubble-context text-center mt-2" style={{ fontSize: "13px" }}>
          Gracias por tu respuesta. Puedes cerrar esta ventana.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="bubble-user">
        <textarea
          value={respuesta}
          onChange={(e) => setRespuesta(e.target.value)}
          required
          disabled={enviando}
          className="chat-textarea"
          placeholder="Escribe tu respuesta..."
          rows={3}
        />
      </div>

      {error && (
        <p style={{ color: "#e53935", fontSize: "13px", marginTop: "8px", textAlign: "center" }}>
          {error}
        </p>
      )}

      <div className="chat-actions">
        <button
          type="submit"
          className="chat-send"
          title="Enviar"
          disabled={enviando || !respuesta.trim()}
          style={{ opacity: enviando || !respuesta.trim() ? 0.6 : 1 }}
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
