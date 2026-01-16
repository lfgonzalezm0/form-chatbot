import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export const dynamic = "force-dynamic";

// GET: Obtener un usuario por ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const result = await pool.query(
      `SELECT * FROM usuariossystem WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Error al obtener usuario:", error);
    return NextResponse.json(
      { error: "Error al obtener usuario" },
      { status: 500 }
    );
  }
}

// PUT: Actualizar un usuario
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const { nombre, telefono, cuenta, contrasena, proceso, aprobar, asignacion } = body;

    const result = await pool.query(
      `
      UPDATE usuariossystem
      SET
        nombre = COALESCE($2, nombre),
        telefono = COALESCE($3, telefono),
        cuenta = COALESCE($4, cuenta),
        contrasena = COALESCE($5, contrasena),
        proceso = COALESCE($6, proceso),
        aprobar = COALESCE($7, aprobar),
        asignacion = COALESCE($8, asignacion)
      WHERE id = $1
      RETURNING *
      `,
      [id, nombre, telefono, cuenta, contrasena, proceso, aprobar, asignacion]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      usuario: result.rows[0]
    });
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    return NextResponse.json(
      { error: "Error al actualizar usuario" },
      { status: 500 }
    );
  }
}
