import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

// GET: Obtener una necesidad por ID
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

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

    let query = `SELECT * FROM necesidadessystem WHERE id = $1`;
    const queryParams: (string | number)[] = [id];

    if (!esAdmin && session.telefono) {
      query += ` AND telefonocaso = $2`;
      queryParams.push(session.telefono);
    }

    const result = await pool.query(query, queryParams);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Necesidad no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Error al obtener necesidad:", error);
    return NextResponse.json(
      { error: "Error al obtener necesidad" },
      { status: 500 }
    );
  }
}

// PUT: Actualizar una necesidad
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

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

    // Verificar que la necesidad pertenezca al usuario
    let checkQuery = `SELECT * FROM necesidadessystem WHERE id = $1`;
    const checkParams: (string | number)[] = [id];

    if (!esAdmin && session.telefono) {
      checkQuery += ` AND telefonocaso = $2`;
      checkParams.push(session.telefono);
    }

    const checkResult = await pool.query(checkQuery, checkParams);

    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Necesidad no encontrada o sin acceso" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { categoria, necesidad, habilitado } = body;

    const result = await pool.query(
      `UPDATE necesidadessystem
       SET categoria = COALESCE($2, categoria),
           necesidad = COALESCE($3, necesidad),
           habilitado = COALESCE($4, habilitado)
       WHERE id = $1
       RETURNING *`,
      [id, categoria, necesidad, habilitado]
    );

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Error al actualizar necesidad:", error);
    return NextResponse.json(
      { error: "Error al actualizar necesidad" },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar una necesidad
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

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

    let query = `DELETE FROM necesidadessystem WHERE id = $1`;
    const queryParams: (string | number)[] = [id];

    if (!esAdmin && session.telefono) {
      query += ` AND telefonocaso = $2`;
      queryParams.push(session.telefono);
    }

    query += ` RETURNING id`;

    const result = await pool.query(query, queryParams);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Necesidad no encontrada o sin acceso" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Necesidad eliminada correctamente"
    });
  } catch (error) {
    console.error("Error al eliminar necesidad:", error);
    return NextResponse.json(
      { error: "Error al eliminar necesidad" },
      { status: 500 }
    );
  }
}
