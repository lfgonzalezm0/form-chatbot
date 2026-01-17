import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

// GET: Obtener todas las preguntas (opcionalmente filtradas por necesidad)
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

    // Obtener parámetros de filtro
    const { searchParams } = new URL(req.url);
    const necesidadId = searchParams.get("necesidad_id");
    const categoria = searchParams.get("categoria");
    const necesidad = searchParams.get("necesidad");

    const params: (string | number)[] = [];
    let paramIndex = 1;
    let baseSelect: string;
    let baseFrom: string;

    if (esAdmin) {
      // Admin ve todas las preguntas con info de la cuenta
      baseSelect = `
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
      `;
      baseFrom = `
        FROM preguntassystem p
        LEFT JOIN cuentassystem c ON p.telefonocaso = c.telefono
        WHERE 1=1
      `;
    } else {
      // Usuario normal solo ve sus preguntas
      baseSelect = `
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
      `;
      baseFrom = `
        FROM preguntassystem
        WHERE telefonocaso = $${paramIndex}
      `;
      params.push(session.telefono);
      paramIndex++;
    }

    let query = baseSelect + baseFrom;

    // Filtro por categoría y necesidad
    if (categoria) {
      query += ` AND ${esAdmin ? 'p.' : ''}categoria = $${paramIndex}`;
      params.push(categoria);
      paramIndex++;
    }

    if (necesidad) {
      query += ` AND ${esAdmin ? 'p.' : ''}necesidad = $${paramIndex}`;
      params.push(necesidad);
      paramIndex++;
    }

    query += ` ORDER BY ${esAdmin ? 'p.' : ''}categoria ASC, ${esAdmin ? 'p.' : ''}necesidad ASC, ${esAdmin ? 'p.' : ''}pregunta ASC`;

    const result = await pool.query(query, params);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error al obtener preguntas:", error);
    return NextResponse.json(
      { error: "Error al obtener preguntas" },
      { status: 500 }
    );
  }
}

// POST: Crear nueva pregunta
export async function POST(req: NextRequest) {
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
    const body = await req.json();
    const { categoria, necesidad, pregunta, respuesta, variante, imagenUrl, videoUrl } = body;

    if (!categoria || !necesidad || !pregunta) {
      return NextResponse.json(
        { error: "Categoría, necesidad y pregunta son requeridos" },
        { status: 400 }
      );
    }

    // El telefonocaso siempre es el del usuario logueado
    const telefonocaso = session.telefono;

    // Insertar el registro con las URLs directamente
    const result = await pool.query(
      `INSERT INTO preguntassystem (telefonocaso, categoria, necesidad, pregunta, respuesta, variante, urlimagen, videourl)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [telefonocaso, categoria, necesidad, pregunta, respuesta || null, variante || null, imagenUrl || null, videoUrl || null]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error("Error al crear pregunta:", error);
    return NextResponse.json(
      { error: "Error al crear pregunta" },
      { status: 500 }
    );
  }
}
