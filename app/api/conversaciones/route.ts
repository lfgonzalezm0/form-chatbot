import { NextResponse } from "next/server";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
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
        accionadmin,
        respuesta,
        creado
      FROM consultanecesidad
      ORDER BY creado DESC
      `
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error al obtener conversaciones:", error);
    return NextResponse.json(
      { error: "Error al obtener conversaciones" },
      { status: 500 }
    );
  }
}
