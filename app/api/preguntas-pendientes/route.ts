import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

// GET: Obtener preguntas pendientes (habilitado = false)
export async function GET(req: NextRequest) {
  try {
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

    // Verificar acceso al módulo
    if (!esAdmin) {
      const tieneAcceso = session.modulos && Array.isArray(session.modulos) &&
        (session.modulos.includes("preguntas") || session.modulos.includes("conversaciones"));
      if (!tieneAcceso) {
        return NextResponse.json(
          { error: "No tiene acceso a este módulo" },
          { status: 403 }
        );
      }
    }

    const { searchParams } = new URL(req.url);
    const busqueda = searchParams.get("busqueda");
    const categoria = searchParams.get("categoria");

    const params: (string | boolean)[] = [];
    let paramIndex = 1;

    let query: string;

    if (esAdmin) {
      // Admin ve todas las preguntas pendientes con info de la cuenta
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
          p.habilitado,
          p.contexto,
          p.enlace,
          c.nombre as cuenta_nombre
        FROM preguntassystem p
        LEFT JOIN cuentassystem c ON p.telefonocaso = c.telefono
        WHERE p.habilitado = false
      `;
    } else {
      // Usuario normal solo ve sus preguntas pendientes
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
          habilitado,
          contexto,
          enlace
        FROM preguntassystem
        WHERE habilitado = false AND telefonocaso = $${paramIndex}
      `;
      params.push(session.telefono);
      paramIndex++;
    }

    // Filtro por categoría
    if (categoria) {
      query += ` AND ${esAdmin ? 'p.' : ''}categoria = $${paramIndex}`;
      params.push(categoria);
      paramIndex++;
    }

    // Filtro por búsqueda
    if (busqueda) {
      const prefix = esAdmin ? 'p.' : '';
      query += ` AND (
        ${prefix}pregunta ILIKE $${paramIndex} OR
        ${prefix}necesidad ILIKE $${paramIndex} OR
        ${prefix}categoria ILIKE $${paramIndex} OR
        ${prefix}contexto ILIKE $${paramIndex}
      )`;
      params.push(`%${busqueda}%`);
      paramIndex++;
    }

    query += ` ORDER BY ${esAdmin ? 'p.' : ''}id DESC`;

    const result = await pool.query(query, params);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error al obtener preguntas pendientes:", error);
    return NextResponse.json(
      { error: "Error al obtener preguntas pendientes" },
      { status: 500 }
    );
  }
}
