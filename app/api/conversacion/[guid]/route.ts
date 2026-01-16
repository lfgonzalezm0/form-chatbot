import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
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
        c.enlace,
        c.accionadmin,
        c.respuesta,
        c.creado,
        u.nombre as nombreusuario
      FROM consultanecesidad c
      LEFT JOIN usuariossystem u ON c.telefonoempresa = u.telefonocaso
      WHERE c.guid = $1
    `;

    const queryParams: string[] = [guid];

    // Si no es admin, verificar que la conversación pertenezca al usuario
    if (!esAdmin && session.telefono) {
      query += ` AND c.telefonoempresa = $2`;
      queryParams.push(session.telefono);
    }

    query += ` LIMIT 1`;

    const result = await pool.query(query, queryParams);

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
