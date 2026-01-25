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

    let query: string;
    const params: string[] = [];

    if (esAdmin) {
      // Admin ve todos los registros
      query = `
        SELECT
          id,
          telefonocaso,
          categoria,
          necesidad,
          pregunta,
          respuesta,
          variante,
          urlimagen,
          videourl,
          creado
        FROM preguntassystem
        ORDER BY creado DESC, id DESC
      `;
    } else {
      // Usuario normal solo ve sus propios registros
      query = `
        SELECT
          id,
          telefonocaso,
          categoria,
          necesidad,
          pregunta,
          respuesta,
          variante,
          urlimagen,
          videourl,
          creado
        FROM preguntassystem
        WHERE telefonocaso = $1
        ORDER BY creado DESC, id DESC
      `;
      params.push(session.telefono);
    }

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
