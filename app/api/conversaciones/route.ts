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
        c.guid,
        c.telefonocliente,
        c.telefonoempresa,
        c.contexto,
        c.pregunta,
        c.estado,
        c.paso,
        c.accionadmin,
        c.respuesta,
        c.creado,
        u.nombre as nombreusuario
      FROM consultanecesidad c
      LEFT JOIN usuariossystem u ON c.telefonoempresa = u.telefonocaso
    `;

    const params: string[] = [];

    // Si no es admin, filtrar por telefonoempresa del usuario
    if (!esAdmin && session.telefono) {
      query += ` WHERE c.telefonoempresa = $1`;
      params.push(session.telefono);
    }

    query += ` ORDER BY c.creado DESC`;

    const result = await pool.query(query, params);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error al obtener conversaciones:", error);
    return NextResponse.json(
      { error: "Error al obtener conversaciones" },
      { status: 500 }
    );
  }
}
