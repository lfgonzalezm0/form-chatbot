import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

// GET: Obtener todos los usuarios
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
        id,
        nombre,
        telefono,
        cuenta,
        contrasena,
        proceso,
        aprobar,
        asignacion
      FROM usuariossystem
    `;

    const params: string[] = [];

    // Si no es admin, filtrar solo su propio registro
    if (!esAdmin && session.telefono) {
      query += ` WHERE telefono = $1`;
      params.push(session.telefono);
    }

    query += ` ORDER BY id DESC`;

    const result = await pool.query(query, params);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    return NextResponse.json(
      { error: "Error al obtener usuarios" },
      { status: 500 }
    );
  }
}

// PUT: Actualizar masivamente aprobar o asignacion (solo admin)
export async function PUT(req: NextRequest) {
  try {
    // Verificar que sea administrador
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");

    if (!sessionCookie) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const session = JSON.parse(sessionCookie.value);

    if (session.tipousuario !== "Administrador") {
      return NextResponse.json(
        { error: "No tiene permisos para realizar esta acción" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { ids, campo, valor } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "Se requiere un array de IDs" },
        { status: 400 }
      );
    }

    if (!campo || !["aprobar", "asignacion"].includes(campo)) {
      return NextResponse.json(
        { error: "Campo invalido. Debe ser 'aprobar' o 'asignacion'" },
        { status: 400 }
      );
    }

    // Ambos campos son boolean
    const valorFinal = valor === true || valor === "activar";

    const placeholders = ids.map((_, i) => `$${i + 2}`).join(", ");
    const query = `
      UPDATE usuariossystem
      SET ${campo} = $1
      WHERE id IN (${placeholders})
    `;

    await pool.query(query, [valorFinal, ...ids]);

    return NextResponse.json({
      success: true,
      message: `${ids.length} usuarios actualizados`
    });
  } catch (error) {
    console.error("Error al actualizar masivamente:", error);
    return NextResponse.json(
      { error: "Error al actualizar usuarios" },
      { status: 500 }
    );
  }
}
