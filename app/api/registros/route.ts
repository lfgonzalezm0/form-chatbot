import { NextResponse } from "next/server";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await pool.query(
      `
      SELECT
        id,
        guid,
        telefonocliente,
        telefonoempresa,
        contexto,
        pregunta,
        respuesta,
        creado,
        enlace,
        estado,
        accionadmin,
        paso,
        bloqueado
      FROM consultanecesidad
      ORDER BY creado DESC
      `
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error al obtener registros:", error);
    return NextResponse.json(
      { error: "Error al obtener registros" },
      { status: 500 }
    );
  }
}
