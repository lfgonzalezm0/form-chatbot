import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

// Verificar acceso al módulo de clubes
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

  // Verificar si el usuario tiene el módulo de clubes
  if (session.modulos && Array.isArray(session.modulos)) {
    if (session.modulos.includes("clubes")) {
      return { autorizado: true, session };
    }
  }

  return { autorizado: false, error: "No tiene acceso al módulo de clubes" };
}

// GET - Obtener un club por ID
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
    const session = verificacion.session;
    const esAdmin = session.tipousuario === "Administrador";

    // Construir query con filtro de teléfono para no admins
    let query = `SELECT * FROM clubesdv0 WHERE id = $1`;
    const queryParams: (string | number)[] = [id];

    if (!esAdmin && session.telefono) {
      query += ` AND telefonocaso = $2`;
      queryParams.push(session.telefono);
    }

    const result = await pool.query(query, queryParams);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Club no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Error al obtener club:", error);
    return NextResponse.json(
      { error: "Error al obtener club" },
      { status: 500 }
    );
  }
}

// PUT - Actualizar un club
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
    const { nombre } = body;

    if (!nombre || !nombre.trim()) {
      return NextResponse.json(
        { error: "El nombre del club es requerido" },
        { status: 400 }
      );
    }

    const session = verificacion.session;
    const esAdmin = session.tipousuario === "Administrador";

    // Verificar si ya existe otro club con el mismo nombre
    let checkQuery = `SELECT id FROM clubesdv0 WHERE nombre ILIKE $1 AND id != $2`;
    const checkParams: (string | number)[] = [nombre.trim(), id];

    if (!esAdmin && session.telefono) {
      checkQuery += ` AND telefonocaso = $3`;
      checkParams.push(session.telefono);
    }

    const existente = await pool.query(checkQuery, checkParams);

    if (existente.rows.length > 0) {
      return NextResponse.json(
        { error: "Ya existe otro club con ese nombre" },
        { status: 400 }
      );
    }

    // Construir query de actualización con filtro de teléfono para no admins
    let query = `UPDATE clubesdv0
       SET nombre = $2
       WHERE id = $1`;
    const queryParams: (string | number)[] = [id, nombre.trim()];

    if (!esAdmin && session.telefono) {
      query += ` AND telefonocaso = $3`;
      queryParams.push(session.telefono);
    }

    query += ` RETURNING *`;

    const result = await pool.query(query, queryParams);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Club no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Error al actualizar club:", error);
    return NextResponse.json(
      { error: "Error al actualizar club" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar un club
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
    const session = verificacion.session;
    const esAdmin = session.tipousuario === "Administrador";

    // Construir query con filtro de teléfono para no admins
    let query = `DELETE FROM clubesdv0 WHERE id = $1`;
    const queryParams: (string | number)[] = [id];

    if (!esAdmin && session.telefono) {
      query += ` AND telefonocaso = $2`;
      queryParams.push(session.telefono);
    }

    query += ` RETURNING id`;

    const result = await pool.query(query, queryParams);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Club no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Club eliminado correctamente"
    });
  } catch (error) {
    console.error("Error al eliminar club:", error);
    return NextResponse.json(
      { error: "Error al eliminar club" },
      { status: 500 }
    );
  }
}
