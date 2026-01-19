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

// GET - Obtener todos los clubes
export async function GET(req: NextRequest) {
  try {
    const verificacion = await verificarAcceso();
    if (!verificacion.autorizado) {
      return NextResponse.json(
        { error: verificacion.error },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const nombre = searchParams.get("nombre");

    const session = verificacion.session;
    const esAdmin = session.tipousuario === "Administrador";

    let query = `SELECT id, nombre, telefonocaso FROM clubesdv0`;
    const conditions: string[] = [];
    const params: (string | null)[] = [];
    let paramCount = 1;

    // Filtro fijo por teléfono para usuarios no administradores
    if (!esAdmin && session.telefono) {
      conditions.push(`telefonocaso = $${paramCount++}`);
      params.push(session.telefono);
    }

    if (nombre) {
      conditions.push(`nombre ILIKE $${paramCount++}`);
      params.push(`%${nombre}%`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }

    query += ` ORDER BY nombre ASC`;

    const result = await pool.query(query, params);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error al obtener clubes:", error);
    return NextResponse.json(
      { error: "Error al obtener clubes" },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo club
export async function POST(req: NextRequest) {
  try {
    const verificacion = await verificarAcceso();
    if (!verificacion.autorizado) {
      return NextResponse.json(
        { error: verificacion.error },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { nombre } = body;

    if (!nombre || !nombre.trim()) {
      return NextResponse.json(
        { error: "El nombre del club es requerido" },
        { status: 400 }
      );
    }

    // Obtener el teléfono del usuario de la sesión
    const session = verificacion.session;
    const telefonocaso = session.telefono || null;

    // Verificar si ya existe un club con el mismo nombre para este usuario
    const existente = await pool.query(
      `SELECT id FROM clubesdv0 WHERE nombre ILIKE $1 AND (telefonocaso = $2 OR ($2 IS NULL AND telefonocaso IS NULL))`,
      [nombre.trim(), telefonocaso]
    );

    if (existente.rows.length > 0) {
      return NextResponse.json(
        { error: "Ya existe un club con ese nombre" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `INSERT INTO clubesdv0 (nombre, telefonocaso)
       VALUES ($1, $2)
       RETURNING *`,
      [nombre.trim(), telefonocaso]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error("Error al crear club:", error);
    return NextResponse.json(
      { error: "Error al crear club" },
      { status: 500 }
    );
  }
}
