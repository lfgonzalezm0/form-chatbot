import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

// URL base de la aplicación
const APP_URL = "https://form-chatbot-production.up.railway.app";

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

    let query = `
      SELECT
        id,
        telefonocaso,
        categoria,
        necesidad,
        pregunta,
        respuesta,
        variante,
        imagen,
        video,
        urlimagen
      FROM preguntassystem
      WHERE 1=1
    `;

    const params: (string | number)[] = [];
    let paramIndex = 1;

    // Filtro por telefonocaso si no es admin
    if (!esAdmin && session.telefono) {
      query += ` AND telefonocaso = $${paramIndex}`;
      params.push(session.telefono);
      paramIndex++;
    }

    // Filtro por categoría y necesidad
    if (categoria) {
      query += ` AND categoria = $${paramIndex}`;
      params.push(categoria);
      paramIndex++;
    }

    if (necesidad) {
      query += ` AND necesidad = $${paramIndex}`;
      params.push(necesidad);
      paramIndex++;
    }

    query += ` ORDER BY categoria ASC, necesidad ASC, pregunta ASC`;

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
    const { categoria, necesidad, pregunta, respuesta, variante, imagen, video } = body;

    if (!categoria || !necesidad || !pregunta) {
      return NextResponse.json(
        { error: "Categoría, necesidad y pregunta son requeridos" },
        { status: 400 }
      );
    }

    // El telefonocaso siempre es el del usuario logueado
    const telefonocaso = session.telefono;

    // Insertar el registro
    const result = await pool.query(
      `INSERT INTO preguntassystem (telefonocaso, categoria, necesidad, pregunta, respuesta, variante, imagen, video)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [telefonocaso, categoria, necesidad, pregunta, respuesta || null, variante || null, imagen || null, video || null]
    );

    const nuevaPregunta = result.rows[0];

    // Si hay imagen, generar y guardar la URL
    if (imagen) {
      const urlimagen = `${APP_URL}/api/imagen/${nuevaPregunta.id}`;
      await pool.query(
        `UPDATE preguntassystem SET urlimagen = $1 WHERE id = $2`,
        [urlimagen, nuevaPregunta.id]
      );
      nuevaPregunta.urlimagen = urlimagen;
    }

    return NextResponse.json(nuevaPregunta, { status: 201 });
  } catch (error) {
    console.error("Error al crear pregunta:", error);
    return NextResponse.json(
      { error: "Error al crear pregunta" },
      { status: 500 }
    );
  }
}
