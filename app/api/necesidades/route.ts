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

    let query: string;
    const params: string[] = [];

    if (esAdmin) {
      // Admin ve todas las necesidades con info de la cuenta
      query = `
        SELECT
          n.id,
          n.telefonocaso,
          n.categoria,
          n.necesidad,
          n.descripcion,
          n.habilitado,
          c.nombre as cuenta_nombre
        FROM necesidadessystem n
        LEFT JOIN cuentassystem c ON n.telefonocaso = c.telefono
        ORDER BY n.categoria ASC, n.necesidad ASC
      `;
    } else {
      // Usuario normal solo ve sus necesidades
      query = `
        SELECT
          id,
          telefonocaso,
          categoria,
          necesidad,
          descripcion,
          habilitado
        FROM necesidadessystem
        WHERE telefonocaso = $1
        ORDER BY categoria ASC, necesidad ASC
      `;
      params.push(session.telefono);
    }

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
    const { categoria, necesidad, descripcion, habilitado } = body;

    if (!categoria || !necesidad) {
      return NextResponse.json(
        { error: "Categoría y necesidad son requeridos" },
        { status: 400 }
      );
    }

    // El telefonocaso siempre es el del usuario logueado
    const telefonocaso = session.telefono;

    const result = await pool.query(
      `INSERT INTO necesidadessystem (telefonocaso, categoria, necesidad, descripcion, habilitado)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [telefonocaso, categoria, necesidad, descripcion || null, habilitado ?? true]
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
