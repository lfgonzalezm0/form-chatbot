import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

// GET: Obtener una pregunta por ID
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

    let query = `SELECT * FROM preguntassystem WHERE id = $1`;
    const queryParams: (string | number)[] = [id];

    if (!esAdmin && session.telefono) {
      query += ` AND telefonocaso = $2`;
      queryParams.push(session.telefono);
    }

    const result = await pool.query(query, queryParams);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Pregunta no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Error al obtener pregunta:", error);
    return NextResponse.json(
      { error: "Error al obtener pregunta" },
      { status: 500 }
    );
  }
}

// PUT: Actualizar una pregunta
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

    // Verificar que la pregunta pertenezca al usuario
    let checkQuery = `SELECT * FROM preguntassystem WHERE id = $1`;
    const checkParams: (string | number)[] = [id];

    if (!esAdmin && session.telefono) {
      checkQuery += ` AND telefonocaso = $2`;
      checkParams.push(session.telefono);
    }

    const checkResult = await pool.query(checkQuery, checkParams);

    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Pregunta no encontrada o sin acceso" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { categoria, necesidad, pregunta, respuesta, variante, imagenUrl, videoUrl } = body;

    // Actualizar con las URLs directamente
    const result = await pool.query(
      `UPDATE preguntassystem
       SET categoria = COALESCE($2, categoria),
           necesidad = COALESCE($3, necesidad),
           pregunta = COALESCE($4, pregunta),
           respuesta = COALESCE($5, respuesta),
           variante = COALESCE($6, variante),
           urlimagen = $7,
           videourl = $8
       WHERE id = $1
       RETURNING *`,
      [id, categoria, necesidad, pregunta, respuesta, variante, imagenUrl !== undefined ? imagenUrl : null, videoUrl !== undefined ? videoUrl : null]
    );

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Error al actualizar pregunta:", error);
    return NextResponse.json(
      { error: "Error al actualizar pregunta" },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar una pregunta
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

    let query = `DELETE FROM preguntassystem WHERE id = $1`;
    const queryParams: (string | number)[] = [id];

    if (!esAdmin && session.telefono) {
      query += ` AND telefonocaso = $2`;
      queryParams.push(session.telefono);
    }

    query += ` RETURNING id`;

    const result = await pool.query(query, queryParams);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Pregunta no encontrada o sin acceso" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Pregunta eliminada correctamente"
    });
  } catch (error) {
    console.error("Error al eliminar pregunta:", error);
    return NextResponse.json(
      { error: "Error al eliminar pregunta" },
      { status: 500 }
    );
  }
}
