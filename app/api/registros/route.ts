import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Obtener sesión del usuario
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");

    if (!sessionCookie) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const session = JSON.parse(sessionCookie.value);
    const esAdmin = session.tipousuario === "Administrador";

    let query = `
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
    `;

    const params: string[] = [];

    // Si no es admin, filtrar por teléfono del usuario
    if (!esAdmin && session.telefono) {
      query += ` WHERE telefonocliente = $1`;
      params.push(session.telefono);
    }

    query += ` ORDER BY creado DESC`;

    const result = await pool.query(query, params);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error al obtener registros:", error);
    return NextResponse.json(
      { error: "Error al obtener registros" },
      { status: 500 }
    );
  }
}
