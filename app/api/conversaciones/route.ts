import { NextResponse } from "next/server";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await pool.query(
      `
      SELECT
        c.guid,
        c.telefonocliente,
        c.contexto,
        c.pregunta,
        c.estado,
        c.paso,
        c.accionadmin,
        c.respuesta,
        c.creado,
        u.nombre as nombreusuario
      FROM consultanecesidad c
      LEFT JOIN usuariossystem u ON c.telefonocliente = u.telefono
      ORDER BY c.creado DESC
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
