import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { enlace, respuesta, guid } = body;

    if (!enlace || !respuesta || !guid) {
      return NextResponse.json(
        { error: "Faltan datos requeridos" },
        { status: 400 }
      );
    }

    // Hacer POST al webhook de n8n
    const response = await fetch(enlace, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        guid,
        respuesta,
      }),
    });

    if (!response.ok) {
      console.error("Error del webhook:", response.status, response.statusText);
      return NextResponse.json(
        { error: "Error al enviar respuesta" },
        { status: 500 }
      );
    }

    // Actualizar el estado a "completado" en la base de datos
    await pool.query(
      `
      UPDATE consultanecesidad
      SET estado = 'completado', respuesta = $2
      WHERE guid = $1
      `,
      [guid, respuesta]
    );

    console.log("Estado actualizado a completado para GUID:", guid);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al procesar la solicitud:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
