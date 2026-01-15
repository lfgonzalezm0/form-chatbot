import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { enlace, accion, respuesta, guid } = body;

    if (!enlace || !accion || !guid) {
      return NextResponse.json(
        { error: "Faltan datos requeridos" },
        { status: 400 }
      );
    }

    // Validar que si la accion es responder, tenga respuesta
    if (accion === "responder" && !respuesta) {
      return NextResponse.json(
        { error: "Se requiere una respuesta" },
        { status: 400 }
      );
    }

    // Preparar payload para n8n
    const n8nPayload = {
      guid,
      accion,
      respuesta: accion === "responder" ? respuesta : null,
    };

    // Hacer POST al webhook de n8n
    const response = await fetch(enlace, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(n8nPayload),
    });

    if (!response.ok) {
      console.error("Error del webhook:", response.status, response.statusText);
      return NextResponse.json(
        { error: "Error al enviar respuesta" },
        { status: 500 }
      );
    }

    // Actualizar el estado y la respuesta en la base de datos
    await pool.query(
      `
      UPDATE consultanecesidad
      SET estado = 'cerrado', respuesta = $2
      WHERE guid = $1
      `,
      [guid, accion === "responder" ? respuesta : accion]
    );

    console.log("Estado actualizado para GUID:", guid, "- Accion:", accion);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al procesar la solicitud:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
