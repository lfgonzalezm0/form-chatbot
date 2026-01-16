import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

// GET: Obtener un usuario por ID
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Verificar sesión
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

    // Obtener usuario
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

    const usuario = result.rows[0];

    // Si no es admin, verificar que sea su propio registro por telefonocaso
    if (!esAdmin && session.telefono !== usuario.telefonocaso) {
      return NextResponse.json(
        { error: "No tiene acceso a este recurso" },
        { status: 403 }
      );
    }

    return NextResponse.json(usuario);
  } catch (error) {
    console.error("Error al obtener usuario:", error);
    return NextResponse.json(
      { error: "Error al obtener usuario" },
      { status: 500 }
    );
  }
}

// PUT: Actualizar un usuario (solo admin puede editar cualquiera)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Verificar sesión
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

    // Solo admin puede editar usuarios
    if (!esAdmin) {
      return NextResponse.json(
        { error: "No tiene permisos para editar usuarios" },
        { status: 403 }
      );
    }

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

// DELETE: Eliminar un usuario (solo admin)
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Verificar sesión y que sea admin
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
        { error: "No tiene permisos para eliminar usuarios" },
        { status: 403 }
      );
    }

    const result = await pool.query(
      `DELETE FROM usuariossystem WHERE id = $1 RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Usuario eliminado correctamente"
    });
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    return NextResponse.json(
      { error: "Error al eliminar usuario" },
      { status: 500 }
    );
  }
}
