import { NextResponse } from "next/server";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ guid: string }> }
) {
  const { guid } = await params;

  if (!guid) {
    return NextResponse.json(
      { error: "GUID requerido" },
      { status: 400 }
    );
  }

  try {
    const result = await pool.query(
      `
      SELECT
        guid,
        telefonocliente,
        contexto,
        pregunta,
        estado,
        paso,
        enlace,
        accionadmin,
        respuesta,
        creado
      FROM consultanecesidad
      WHERE guid = $1
      LIMIT 1
      `,
      [guid]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Conversacion no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Error al obtener conversacion:", error);
    return NextResponse.json(
      { error: "Error al obtener conversacion" },
      { status: 500 }
    );
  }
}
