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
      // Admin ve todas las preguntas con info de la cuenta
      query = `
        SELECT
          p.id,
          p.telefonocaso,
          p.categoria,
          p.necesidad,
          p.pregunta,
          p.respuesta,
          p.variante,
          p.urlimagen,
          p.videourl,
          c.nombre as cuenta_nombre
        FROM preguntassystem p
        LEFT JOIN cuentassystem c ON p.telefonocaso = c.telefono
        ORDER BY p.id DESC
      `;
    } else {
      // Usuario normal solo ve sus preguntas
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
          videourl
        FROM preguntassystem
        WHERE telefonocaso = $1
        ORDER BY id DESC
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
