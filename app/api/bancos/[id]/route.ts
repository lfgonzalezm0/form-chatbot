import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

// Verificar acceso al módulo de bancos
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

  // Verificar si el usuario tiene el módulo de bancos
  if (session.modulos && Array.isArray(session.modulos)) {
    if (session.modulos.includes("bancos")) {
      return { autorizado: true, session };
    }
  }

  return { autorizado: false, error: "No tiene acceso al módulo de bancos" };
}

// GET - Obtener un banco por ID
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
      `SELECT * FROM bancosdv0 WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Banco no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Error al obtener banco:", error);
    return NextResponse.json(
      { error: "Error al obtener banco" },
      { status: 500 }
    );
  }
}

// PUT - Actualizar un banco
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
    const { nombre, numerocuenta, tipocuenta, identificacion, correo, telefono } = body;

    // Validaciones
    if (!nombre || !nombre.trim()) {
      return NextResponse.json(
        { error: "El nombre del banco es requerido" },
        { status: 400 }
      );
    }

    if (!numerocuenta || !numerocuenta.trim()) {
      return NextResponse.json(
        { error: "El número de cuenta es requerido" },
        { status: 400 }
      );
    }

    if (!tipocuenta || !tipocuenta.trim()) {
      return NextResponse.json(
        { error: "El tipo de cuenta es requerido" },
        { status: 400 }
      );
    }

    if (!identificacion || !identificacion.trim()) {
      return NextResponse.json(
        { error: "La identificación es requerida" },
        { status: 400 }
      );
    }

    // Verificar si ya existe otro banco con el mismo número de cuenta
    const existente = await pool.query(
      `SELECT id FROM bancosdv0 WHERE numerocuenta = $1 AND id != $2`,
      [numerocuenta.trim(), id]
    );

    if (existente.rows.length > 0) {
      return NextResponse.json(
        { error: "Ya existe otro banco con ese número de cuenta" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `UPDATE bancosdv0
       SET nombre = $2, numerocuenta = $3, tipocuenta = $4, identificacion = $5,
           correo = $6, telefono = $7, modificado = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [
        id,
        nombre.trim(),
        numerocuenta.trim(),
        tipocuenta.trim(),
        identificacion.trim(),
        correo?.trim() || null,
        telefono?.trim() || null
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Banco no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Error al actualizar banco:", error);
    return NextResponse.json(
      { error: "Error al actualizar banco" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar un banco
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
      `DELETE FROM bancosdv0 WHERE id = $1 RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Banco no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Banco eliminado correctamente"
    });
  } catch (error) {
    console.error("Error al eliminar banco:", error);
    return NextResponse.json(
      { error: "Error al eliminar banco" },
      { status: 500 }
    );
  }
}
