import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

// Verificar acceso al módulo de tarifas
async function verificarAcceso() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session");

  if (!sessionCookie) {
    return { autorizado: false, error: "No hay sesión activa" };
  }

  const session = JSON.parse(sessionCookie.value);

  // Los administradores siempre tienen acceso
  if (session.tipousuario === "Administrador") {
    return { autorizado: true, session };
  }

  // Verificar si el usuario tiene el módulo de tarifas
  if (session.modulos && Array.isArray(session.modulos)) {
    if (session.modulos.includes("tarifas")) {
      return { autorizado: true, session };
    }
  }

  return { autorizado: false, error: "No tiene acceso al módulo de tarifas" };
}

// GET - Obtener una tarifa por ID
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const verificacion = await verificarAcceso();
    if (!verificacion.autorizado) {
      return NextResponse.json(
        { error: verificacion.error },
        { status: 403 }
      );
    }

    const { id } = await params;

    const result = await pool.query(
      `SELECT * FROM tarifas_transporte WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Tarifa no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Error al obtener tarifa:", error);
    return NextResponse.json(
      { error: "Error al obtener tarifa" },
      { status: 500 }
    );
  }
}

// PUT - Actualizar una tarifa
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const verificacion = await verificarAcceso();
    if (!verificacion.autorizado) {
      return NextResponse.json(
        { error: verificacion.error },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { origen, destino, ciudad_destino, precio } = body;

    const result = await pool.query(
      `UPDATE tarifas_transporte
       SET origen = COALESCE($2, origen),
           destino = COALESCE($3, destino),
           ciudad_destino = COALESCE($4, ciudad_destino),
           precio = COALESCE($5, precio)
       WHERE id = $1
       RETURNING *`,
      [id, origen, destino, ciudad_destino, precio]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Tarifa no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Error al actualizar tarifa:", error);
    return NextResponse.json(
      { error: "Error al actualizar tarifa" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar una tarifa
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const verificacion = await verificarAcceso();
    if (!verificacion.autorizado) {
      return NextResponse.json(
        { error: verificacion.error },
        { status: 403 }
      );
    }

    const { id } = await params;

    const result = await pool.query(
      `DELETE FROM tarifas_transporte WHERE id = $1 RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Tarifa no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Tarifa eliminada correctamente"
    });
  } catch (error) {
    console.error("Error al eliminar tarifa:", error);
    return NextResponse.json(
      { error: "Error al eliminar tarifa" },
      { status: 500 }
    );
  }
}
