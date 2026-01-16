import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";

// GET: Obtener todos los usuarios
export async function GET() {
  try {
    const result = await pool.query(
      `
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
      ORDER BY id DESC
      `
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    return NextResponse.json(
      { error: "Error al obtener usuarios" },
      { status: 500 }
    );
  }
}

// PUT: Actualizar masivamente aprobar o asignacion
export async function PUT(req: NextRequest) {
  try {
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

    // Para aprobar es boolean, para asignacion es texto
    let valorFinal: boolean | string;
    if (campo === "aprobar") {
      valorFinal = valor === true || valor === "activar";
    } else {
      valorFinal = valor === true || valor === "activar" ? "activar" : "desactivar";
    }

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
