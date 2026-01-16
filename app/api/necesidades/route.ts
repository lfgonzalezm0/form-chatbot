import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

// GET: Obtener todas las necesidades
export async function GET() {
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

    let query = `
      SELECT
        id,
        telefonocaso,
        categoria,
        necesidad,
        habilitado
      FROM necesidadessystem
    `;

    const params: string[] = [];

    if (!esAdmin && session.telefono) {
      query += ` WHERE telefonocaso = $1`;
      params.push(session.telefono);
    }

    query += ` ORDER BY categoria ASC, necesidad ASC`;

    const result = await pool.query(query, params);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error al obtener necesidades:", error);
    return NextResponse.json(
      { error: "Error al obtener necesidades" },
      { status: 500 }
    );
  }
}

// POST: Crear nueva necesidad
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
    const { categoria, necesidad, habilitado } = body;

    if (!categoria || !necesidad) {
      return NextResponse.json(
        { error: "Categoría y necesidad son requeridos" },
        { status: 400 }
      );
    }

    // El telefonocaso siempre es el del usuario logueado
    const telefonocaso = session.telefono;

    const result = await pool.query(
      `INSERT INTO necesidadessystem (telefonocaso, categoria, necesidad, habilitado)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [telefonocaso, categoria, necesidad, habilitado ?? true]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error("Error al crear necesidad:", error);
    return NextResponse.json(
      { error: "Error al crear necesidad" },
      { status: 500 }
    );
  }
}
