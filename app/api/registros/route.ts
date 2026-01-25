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

    // Todos los usuarios solo ven sus propios registros (filtrado por telefono)
    const query = `
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

    const result = await pool.query(query, [session.telefono]);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error al obtener registros:", error);
    return NextResponse.json(
      { error: "Error al obtener registros" },
      { status: 500 }
    );
  }
}
