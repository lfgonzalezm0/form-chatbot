import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { cookies } from "next/headers";

// Verificar que el usuario sea administrador
async function verificarAdmin() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session");

  if (!sessionCookie) {
    return { autorizado: false, error: "No hay sesion activa" };
  }

  const session = JSON.parse(sessionCookie.value);

  if (session.tipousuario !== "Administrador") {
    return { autorizado: false, error: "No tiene permisos de administrador" };
  }

  return { autorizado: true, session };
}

// DELETE - Eliminar un registro
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const verificacion = await verificarAdmin();
    if (!verificacion.autorizado) {
      return NextResponse.json(
        { error: verificacion.error },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Verificar que el registro exista
    const existe = await pool.query(
      `SELECT id FROM preguntassystem WHERE id = $1`,
      [id]
    );

    if (existe.rows.length === 0) {
      return NextResponse.json(
        { error: "Registro no encontrado" },
        { status: 404 }
      );
    }

    // Eliminar el registro
    await pool.query(`DELETE FROM preguntassystem WHERE id = $1`, [id]);

    return NextResponse.json({ success: true, message: "Registro eliminado" });
  } catch (error) {
    console.error("Error al eliminar registro:", error);
    return NextResponse.json(
      { error: "Error al eliminar registro" },
      { status: 500 }
    );
  }
}
